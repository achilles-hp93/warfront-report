#!/usr/bin/env node
'use strict';

// scripts/battle_report/tournament.cjs - a knockout tournament of preset armies, played
// by the game's own AI on both seats, one round at a time.
//
//   node scripts/battle_report/tournament.cjs <name> draw --config <file.json> [--seed N] [--force]
//   node scripts/battle_report/tournament.cjs <name> play [--parallel 3] [--lean]
//   node scripts/battle_report/tournament.cjs <name> replay <match id> [--game n] [--reseed] [--drop-later]
//   node scripts/battle_report/tournament.cjs <name> status
//
// The config (scripts/battle_report/tournaments/) names the entrants - "all" for every
// preset army, or a list of "<faction>/preset:<id>" - how many there must be, the map,
// best-of-N and the doctrine ("none": both armies fielded vanilla, record.cjs
// --no-doctrine). `draw` shuffles them into the first round by a seed (random unless
// given; kept in the state so the draw can be shown). `play` plays the current round's
// matches and stops: each round is analysed, and bugs fixed, before the next is played.
// The next `play` opens the next round from the winners. `replay` takes a match's games
// off (to archive/) so the next `play` plays them again - on a fixed build, the same
// seeds play the same battles; --reseed plays new ones. tournament_bracket.cjs holds the
// rules: who won a match, what is played next.
//
// Everything lands in <output dir>/tournaments/<name>/: state.json, each game's record
// under games/ (digest.cjs reads one), round-<n>.txt the round's summary.

const fs = require('fs');
const path = require('path');
const { recordBattle, startRecorder } = require('./record.cjs');
const { OUTPUT_DIR } = require('../output_dir.cjs');
const B = require('./tournament_bracket.cjs');

const REPO = path.resolve(__dirname, '..', '..');
const PRESET_DIR = path.join(REPO, 'data', 'editions', 'fantasy', 'preset_armies');

function parseArgs(argv) {
  const args = { parallel: 3, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => argv[++i];
    if (flag === '--config') args.config = value();
    else if (flag === '--seed') args.seed = Number(value());
    else if (flag === '--force') args.force = true;
    else if (flag === '--parallel') args.parallel = Math.max(1, Number(value()));
    else if (flag === '--lean') args.lean = true;
    else if (flag === '--game') args.game = Number(value());
    else if (flag === '--reseed') args.reseed = true;
    else if (flag === '--drop-later') args.dropLater = true;
    else if (flag.startsWith('--')) throw new Error('unknown flag ' + flag);
    else args.positional.push(flag);
  }
  [args.name, args.command, args.match] = args.positional;
  if (!args.name || !args.command) throw new Error('usage: tournament.cjs <name> draw|play|replay|status [...]');
  return args;
}

// Every preset army as an entrant: { faction, formation, name }.
function allPresets() {
  const out = [];
  fs.readdirSync(PRESET_DIR).sort().forEach(faction => {
    const dir = path.join(PRESET_DIR, faction);
    if (!fs.statSync(dir).isDirectory()) return;
    fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort().forEach(file => {
      const preset = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      out.push({ faction, formation: 'preset:' + preset.id, name: preset.name });
    });
  });
  return out;
}

function entrantsOf(config) {
  const presets = allPresets();
  if (config.entrants === 'all') return presets;
  return config.entrants.map(text => {
    const [faction, formation] = [text.slice(0, text.indexOf('/')), text.slice(text.indexOf('/') + 1)];
    const known = presets.find(p => p.faction === faction && p.formation === formation);
    if (!known) throw new Error('no preset army ' + text);
    return known;
  });
}

const dirOf = name => path.join(OUTPUT_DIR, 'tournaments', name);
const statePath = name => path.join(dirOf(name), 'state.json');
const readState = name => JSON.parse(fs.readFileSync(statePath(name), 'utf8'));
const writeState = (name, state) => fs.writeFileSync(statePath(name), JSON.stringify(state, null, 1));
const gameFile = (match, n) => path.join('games', `${match.id}-g${n}.json`);

function draw(args) {
  if (!args.config) throw new Error('draw needs --config <file.json>');
  const config = JSON.parse(fs.readFileSync(args.config, 'utf8'));
  const entrants = entrantsOf(config);
  if (config.size && entrants.length !== config.size) {
    throw new Error(`${config.name} needs ${config.size} entrants; there are ${entrants.length}:\n  `
      + entrants.map(e => `${e.faction}/${e.formation}`).join('\n  '));
  }
  const dir = dirOf(args.name);
  if (fs.existsSync(statePath(args.name))) {
    if (!args.force) throw new Error(`${args.name} is already drawn (pass --force to draw again; the old one goes to archive/)`);
    archive(dir, ['state.json', 'games'], 'redraw');
  }
  fs.mkdirSync(path.join(dir, 'games'), { recursive: true });
  const seed = args.seed != null ? args.seed : (config.seed != null ? config.seed : Math.floor(Math.random() * 1e9));
  const state = { config, seed, drawnAt: new Date().toISOString(), rounds: [B.drawBracket(entrants, seed)] };
  writeState(args.name, state);
  console.log(`${config.name}: ${entrants.length} entrants drawn with seed ${seed}`);
  console.log(statusText(state));
}

// Move `items` (relative to `dir`) into archive/<time>-<why>/.
function archive(dir, items, why) {
  const to = path.join(dir, 'archive', new Date().toISOString().replace(/[:.]/g, '-') + '-' + why);
  fs.mkdirSync(to, { recursive: true });
  items.forEach(item => {
    const from = path.join(dir, item);
    if (!fs.existsSync(from)) return;
    fs.mkdirSync(path.dirname(path.join(to, item)), { recursive: true });
    fs.renameSync(from, path.join(to, item));
  });
  return to;
}

// Recorders, each its own browser (a background tab's timers are throttled), handed out
// one game at a time.
function recorderPool(size) {
  const idle = [], waiting = [], all = [];
  return {
    async acquire() {
      if (idle.length) return idle.pop();
      if (all.length < size) { const r = await startRecorder(); all.push(r); return r; }
      return new Promise(resolve => waiting.push(resolve));
    },
    release(r) { const next = waiting.shift(); if (next) next(r); else idle.push(r); },
    async stop() { await Promise.all(all.map(r => r.stop())); },
  };
}

// A played game as the bracket reads it: winner and VP by army (0 = match.a).
function gameResult(plan, report, file) {
  const r = report.result || {};
  const army = p => (plan.swapped ? 1 - p : p);
  const vp = r.vp || [0, 0];
  return {
    n: plan.n, seed: plan.seed, swapped: plan.swapped, file,
    winner: r.winner === 0 || r.winner === 1 ? army(r.winner) : null,
    vp: plan.swapped ? [vp[1], vp[0]] : [vp[0], vp[1]],
    round: r.round, reason: r.reason, errors: report.errors.length,
    doctrines: report.meta.doctrines,
  };
}

// Play every match of `round` to its result, best of `state.config.bestOf`, `parallel`
// games at once (each recorder its own browser). `save(match, n, report)` keeps a game's
// record and returns where; `onGame` follows each game, so the caller can keep its state.
// tournament.cjs and league.cjs (its knockout) both play their rounds here.
async function playRound(state, round, { parallel, images = false, lean = false, save, onGame = () => {} }) {
  const { config } = state;
  const pool = recorderPool(parallel);
  const playGame = async (match, matchIndex, n) => {
    const plan = B.gamePlan(state.seed, round.index, matchIndex, match, n);
    const sides = plan.swapped ? [match.b, match.a] : [match.a, match.b];
    const tag = `${match.id} g${n}`;
    const recorder = await pool.acquire();
    let game;
    try {
      const report = await recordBattle(recorder.harness, {
        a: sides[0], b: sides[1], seed: plan.seed, map: config.map, images, lean,
        noDoctrine: config.doctrine === 'none', log: line => console.log(`  [${tag}] ${line}`),
      });
      game = gameResult(plan, report, save(match, n, report));
      const who = game.winner == null ? 'draw' : (game.winner === 0 ? match.a.name : match.b.name);
      console.log(`${tag}: ${who} ${game.vp.join('-')} in round ${game.round}${game.errors ? `, ${game.errors} page errors` : ''}`);
    } catch (err) {
      game = { n, seed: plan.seed, swapped: plan.swapped, failed: err.message };
      console.error(`${tag} FAILED: ${err.message}`);
    } finally {
      pool.release(recorder);
    }
    match.games = match.games.filter(g => g.n !== n).concat([game]).sort((x, y) => x.n - y.n);
    onGame();
    return game;
  };
  const playMatch = async (match, matchIndex) => {
    // A failed game stays failed until the next `play`: a broken battle is looked at first.
    for (;;) {
      const count = B.gamesToPlay(match, config.bestOf);
      if (!count) break;
      const games = await Promise.all(B.nextGameNumbers(match, count).map(n => playGame(match, matchIndex, n)));
      if (games.some(g => g.failed)) break;
    }
  };
  try {
    await Promise.all(round.matches.map(playMatch));
  } finally {
    await pool.stop();
  }
  B.settleRound(round, config.bestOf);
}

async function play(args) {
  const state = readState(args.name);
  const { config } = state;
  let round = state.rounds[state.rounds.length - 1];
  if (B.settleRound(round, config.bestOf)) {
    const next = B.nextRound(state, config.bestOf);
    if (!next) { console.log(statusText(state)); return; }
    state.rounds.push(next);
    writeState(args.name, state);
    round = next;
  }
  const dir = dirOf(args.name);
  fs.mkdirSync(path.join(dir, 'games'), { recursive: true });
  console.log(`${config.name} - ${round.label}: ${round.matches.length} matches, best of ${config.bestOf}, ${config.map}`);
  await playRound(state, round, {
    parallel: args.parallel, lean: !!args.lean,
    save: (match, n, report) => {
      const file = gameFile(match, n);
      fs.writeFileSync(path.join(dir, file), JSON.stringify(report));
      return file;
    },
    onGame: () => writeState(args.name, state),
  });
  writeState(args.name, state);
  const text = roundSummary(state, round);
  fs.writeFileSync(path.join(dir, `round-${round.index + 1}.txt`), text);
  console.log('\n' + text);
}

function replay(args) {
  if (!args.match) throw new Error('replay needs a match id, e.g. R1-M03');
  const state = readState(args.name);
  const { removed, droppedRounds } = B.replayMatch(state, args.match, { fromGame: args.game || 1, reseed: !!args.reseed, dropLater: !!args.dropLater });
  const dir = dirOf(args.name);
  const files = removed.filter(g => g.file).map(g => g.file);
  const to = files.length ? archive(dir, files, 'replay-' + args.match) : null;
  writeState(args.name, state);
  console.log(`${args.match}: ${removed.length} game(s) taken off${to ? ' (kept in ' + to + ')' : ''}`
    + `${droppedRounds.length ? '; dropped ' + droppedRounds.join(', ') : ''}. The next \`play\` plays them${args.reseed ? ' on new seeds' : ''}.`);
}

function score(match) {
  const s = B.matchStanding(match);
  return `${s.wins[0]}-${s.wins[1]}${s.draws ? ` (${s.draws} drawn)` : ''}`;
}

function statusText(state) {
  const lines = [`${state.config.name} - seed ${state.seed}, ${state.config.map}, best of ${state.config.bestOf}, doctrine ${state.config.doctrine}`];
  state.rounds.forEach(round => {
    lines.push('', round.label);
    round.matches.forEach(m => {
      const mark = side => (m.winner === side ? '*' : ' ');
      lines.push(`  ${m.id}  ${mark(0)}${m.a.name.padEnd(30)} ${score(m).padEnd(14)} ${mark(1)}${m.b.name}`
        + (m.games.some(g => g.failed) ? '   [failed game to replay]' : ''));
    });
  });
  const last = state.rounds[state.rounds.length - 1];
  if (last.matches.length === 1 && (last.matches[0].winner === 0 || last.matches[0].winner === 1)) {
    const m = last.matches[0];
    lines.push('', 'Champion: ' + (m.winner === 0 ? m.a.name : m.b.name));
  }
  return lines.join('\n');
}

// A battle this long is worth a look: a skirmish ends when a side reaches the VP target
// (or loses its HQ), and battles that drag on are ones neither side is scoring.
const LONG_BATTLE_ROUNDS = 8;

// A round's results, then what to look at before the next: failed games, page errors,
// drawn games, battles ended by anything but VP, battles that dragged on, matches
// settled on VP over the match, and any army that fought with a doctrine when the
// tournament plays without.
function roundSummary(state, round) {
  const lines = [`${state.config.name} - ${round.label}`, ''];
  const flags = [];
  round.matches.forEach(m => {
    const winner = m.winner === 0 ? m.a.name : m.winner === 1 ? m.b.name : 'undecided';
    lines.push(`${m.id}  ${m.a.name} ${score(m)} ${m.b.name}  -> ${winner}${m.decidedBy && m.decidedBy !== 'games' ? ` (on ${m.decidedBy})` : ''}`);
    m.games.forEach(g => {
      if (g.failed) { lines.push(`    g${g.n} seed ${g.seed}: FAILED - ${g.failed}`); flags.push(`${m.id} g${g.n} failed: ${g.failed}`); return; }
      const who = g.winner == null ? 'draw' : (g.winner === 0 ? m.a.name : m.b.name);
      lines.push(`    g${g.n} seed ${g.seed}${g.swapped ? ' (b first)' : ''}: ${who} ${g.vp.join('-')}, round ${g.round} (${g.reason})${g.errors ? `, ${g.errors} page errors` : ''}  ${g.file}`);
      if (g.errors) flags.push(`${m.id} g${g.n}: ${g.errors} page errors`);
      if (g.winner == null) flags.push(`${m.id} g${g.n}: drawn ${g.vp.join('-')}`);
      if (g.reason && g.reason !== 'VP') flags.push(`${m.id} g${g.n}: ended by ${g.reason} in round ${g.round}`);
      if (g.round >= LONG_BATTLE_ROUNDS) flags.push(`${m.id} g${g.n}: went ${g.round} rounds`);
      if (state.config.doctrine === 'none' && (g.doctrines || []).some(Boolean)) flags.push(`${m.id} g${g.n}: fought with a doctrine (${g.doctrines.filter(Boolean).join(', ')})`);
    });
    if (m.decidedBy && m.decidedBy !== 'games') flags.push(`${m.id}: settled on ${m.decidedBy}`);
  });
  lines.push('', flags.length ? 'To look at before the next round:' : 'Nothing flagged.');
  flags.forEach(f => lines.push('  - ' + f));
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'draw') return draw(args);
  if (args.command === 'play') return play(args);
  if (args.command === 'replay') return replay(args);
  if (args.command === 'status') return console.log(statusText(readState(args.name)));
  throw new Error('unknown command ' + args.command + ' (draw, play, replay, status)');
}

if (require.main === module) {
  main().catch(err => { console.error(err.stack || err.message); process.exit(1); });
}

module.exports = { allPresets, entrantsOf, gameResult, recorderPool, playRound, roundSummary, statusText };
