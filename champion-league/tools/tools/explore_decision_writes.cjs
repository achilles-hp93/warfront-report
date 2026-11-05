// Explore what one aiChooseAction call reads/writes outside its result:
// G keys changed, AI keys changed, Math.random draws, rules RNG draws.
// usage: WARFRONT_OUTPUT_DIR=... node explore_decision_writes.cjs <repo> [games] [rounds]
const path = require('path');
const vm = require('vm');
const repo = process.argv[2];
const games = Number(process.argv[3] || 2);
const rounds = Number(process.argv[4] || 3);
const crypto = require('crypto');
let s = 7 >>> 0;
function rnd() { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
crypto.randomInt = function(a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.floor(rnd() * (b - a)); };
const { GameSession } = require(path.join(repo, 'server/src/game_session.js'));
const { factionRosters } = require(path.join(repo, 'scripts/lib/faction_rosters.cjs'));

function canon(v, memo, p) {
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'function') return '<fn>';
    if (typeof v === 'number' && Number.isNaN(v)) return 'NaN';
    return JSON.stringify(v === undefined ? '<undef>' : v);
  }
  if (memo.has(v)) return '<ref ' + memo.get(v) + '>';
  memo.set(v, p);
  if (v instanceof Map) return 'Map{' + Array.from(v.entries()).map(([k, x], i) => canon(k, memo, p + '.k' + i) + ':' + canon(x, memo, p + '.' + i)).join(',') + '}';
  if (v instanceof Set) return 'Set{' + Array.from(v).map((x, i) => canon(x, memo, p + '.' + i)).join(',') + '}';
  if (Array.isArray(v)) return '[' + v.map((x, i) => canon(x, memo, p + '.' + i)).join(',') + ']';
  return '{' + Object.keys(v).map(k => JSON.stringify(k) + ':' + canon(v[k], memo, p + '.' + k)).join(',') + '}';
}
function keyed(obj) { const out = {}; for (const k of Object.keys(obj)) { try { out[k] = canon(obj[k], new Map(), k); } catch (e) { out[k] = '<err ' + e.message + '>'; } } return out; }
function diffKeys(a, b) { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].filter(k => a[k] !== b[k]); }

const rosters = factionRosters();
const factions = Object.keys(rosters);
function formation(faction, k, player) {
  const roster = rosters[faction];
  const character = roster.hqs.length ? roster.hqs[k % roster.hqs.length] : null;
  const units = roster.units.length ? [0, 1, 2].map(i => roster.units[(k * 3 + i) % roster.units.length]) : [];
  const col = player === 0 ? { hq: 2, a: 4, b: 3 } : { hq: 12, a: 10, b: 11 };
  const placed = [{ templateId: 'hq', col: col.hq, row: 7, isHQ: true }];
  if (character) placed.push({ templateId: faction + ':' + character.id, col: col.b, row: 9 });
  [[col.a, 6], [col.a, 8], [col.b, 5]].forEach((at, i) => { if (units[i]) placed.push({ templateId: faction + ':' + units[i].id, col: at[0], row: at[1] }); });
  return placed;
}

const gWrites = {}, aiWrites = {};
let decisions = 0, maxDraws = 0, totalDraws = 0, rulesDraws = 0;
const drawHist = {};
for (let g = 0; g < games; g++) {
  const a = factions[(g * 3) % factions.length], b = factions[(g * 3 + 5) % factions.length];
  const session = new GameSession('x', { mapIdx: 2, deployType: 'central_faceoff', mode: 'skirmish', skirmishMode: 'seize_the_ground', skipChecksum: true, aiBothSides: true });
  session.initGame(formation(a, g, 0), formation(b, g + 1, 1), { factionId: a }, { factionId: b });
  session.beginFirstRound();
  const ctx = session.ctx;
  const AI = vm.runInContext('AI', ctx);
  let draws = 0;
  const realRandom = ctx.Math.random;
  ctx.Math.random = function() { draws++; return realRandom(); };
  const rr = ctx.RULES_RANDOM;
  let inDecision = false;
  ctx.RULES_RANDOM = { die: f => { if (inDecision) rulesDraws++; return rr.die(f); }, number: () => { if (inDecision) rulesDraws++; return rr.number(); } };
  let steps = 0;
  while (!session.ended && session.round <= rounds && steps < 3000) {
    const player = session.activePlayer;
    const gBefore = keyed(ctx.G), aiBefore = keyed(AI);
    draws = 0; inDecision = true;
    let action;
    try { action = ctx.aiChooseAction(player); } catch (e) { action = { type: 'pass', player }; console.log('threw', e.message); }
    inDecision = false;
    decisions++; totalDraws += draws; maxDraws = Math.max(maxDraws, draws); drawHist[draws] = (drawHist[draws] || 0) + 1;
    const gAfter = keyed(ctx.G), aiAfter = keyed(AI);
    for (const k of diffKeys(gBefore, gAfter)) gWrites[k] = (gWrites[k] || 0) + 1;
    for (const k of diffKeys(aiBefore, aiAfter)) aiWrites[k] = (aiWrites[k] || 0) + 1;
    let result = session.executeAction(action); steps++;
    if (action.type !== 'pass' && action.type !== 'endActivation') {
      const failure = result ? (result.rejected ? (result.reason || 'rejected') : (result.failed || null)) : null;
      const next = ctx.aiActionTaken(action, failure);
      if (result && result.rejected && next !== 'decideAgain') { result = session.executeAction({ type: 'pass', player }); steps++; }
    }
    let guard = 0;
    while (!session.ended && result && result.pending && guard++ < 30) { const t = session.resolveTimeout(); if (!t || !t.result.ok) break; result = t.result; }
  }
  console.log(`game ${g} ${a} vs ${b}: round ${session.round}, steps ${steps}`);
}
console.log('decisions', decisions, 'Math.random draws total', totalDraws, 'max', maxDraws, 'hist', JSON.stringify(drawHist));
console.log('rules RNG draws inside decisions', rulesDraws);
console.log('G keys written by decisions', gWrites);
console.log('AI keys written by decisions', aiWrites);
