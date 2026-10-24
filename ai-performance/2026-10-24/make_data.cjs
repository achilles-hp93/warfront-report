// Datasets for the AI performance report, from recorded battles.
//   node make_data.cjs <outdir>
// Timing and memory: the lean, profiled perf-* battles. Decision quality: those battles'
// moves, combats and activity, plus the full records of the two 12-battle batches on the
// same engine (Fall Back verdicts, commands and abilities), and the same seeds before the
// three AI fixes of 2026-10-23.
const fs = require('fs');
const path = require('path');
const W = '/home/user/warfront';
const R = W + '/output/battle_reports';
const { aiPerfRecord, topLevel, functionIndex, stats, stageTable } = require(W + '/scripts/battle_report/ai_perf.cjs');
const { tempoRecord } = require(W + '/scripts/battle_report/tempo.cjs');
const { activityRecord } = require(W + '/scripts/battle_report/activity.cjs');
const { fallBackRecord } = require(W + '/scripts/battle_report/fallback.cjs');
const { effectsRecord } = require(W + '/scripts/battle_report/effects.cjs');
const { summarize } = require(W + '/scripts/battle_report/summarize.cjs');

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const write = (name, rows) => { fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(rows)); console.log(name, rows.length); };
const games = dir => fs.readdirSync(path.join(R, dir, 'games')).filter(f => /^game-\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)))
  .map(f => ({ file: f, report: JSON.parse(fs.readFileSync(path.join(R, dir, 'games', f), 'utf8')) }));
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const pct = v => (isFinite(v) ? Math.round(v * 1000) / 10 : null);  // a share, as a percentage
const MB = 1048576;
const short = name => name.replace(/'s /, ' ').replace(/^(Spahbed|Legatus|Pontifex|Flamebringer)\s?/, '');

const MATCHUPS = [
  ['perf-legion-vs-host', 'Legion vs Host'], ['perf-cohort-vs-crusade', 'Cohort vs Crusade'],
  ['perf-immortals-vs-penitent', 'Immortals vs Penitent'], ['perf-cohort-vs-procession', 'Cohort vs Procession'],
  ['perf-host-vs-court', 'Host vs Court'], ['perf-penitent-vs-court', 'Penitent vs Court'],
];
const fileOf = functionIndex(W);
const perf = [];
MATCHUPS.forEach(([dir, matchup]) => {
  if (!fs.existsSync(path.join(R, dir, 'games'))) return;
  games(dir).forEach(g => perf.push({ dir, matchup, file: g.file, report: g.report }));
});
const label = p => `${p.matchup} · ${p.report.meta.map} · seed ${p.report.meta.seed}`;

// ── perf_battles ──
const recs = perf.map(p => Object.assign(aiPerfRecord(p.report, label(p), fileOf), { matchup: p.matchup }));
write('perf_battles', recs.map((x, i) => {
  const rp = perf[i].report;
  const winnerName = x.result && x.result.winner != null ? rp.meta.armyNames[x.result.winner] : 'none';
  const lt = x.longTasks || { count: 0, ms: { total: 0, max: 0 } };
  return {
    battle: x.battle, matchup: x.matchup, map: x.map, seed: x.seed, rounds: x.rounds, winner: winnerName,
    vp: (x.result && x.result.vp || []).join('–'),
    wall_s: r1(x.wallMs / 1000), ai_s: r1(x.aiMs / 1000), script_s: r1(x.scriptMs / 1000),
    ai_share: pct(x.aiMs / x.scriptMs),
    ai_s_per_round: r1(x.aiMs / 1000 / x.rounds),
    turns: x.decisions.all.n, turn_median_ms: Math.round(x.decisions.all.median), turn_p90_ms: Math.round(x.decisions.all.p90),
    turn_max_ms: Math.round(x.decisions.all.max), choices: x.picks.all.n,
    long_tasks: lt.count, long_task_s: r1(lt.ms.total / 1000), long_task_max_ms: Math.round(lt.ms.max),
    peak_mb: Math.round(x.memory.peak / MB), end_mb: Math.round(x.memory.end / MB), retained_mb: Math.round(x.memory.retained / MB),
    end_nodes: x.memory.perRound[x.memory.perRound.length - 1].nodes, retained_nodes: x.memory.retainedNodes,
    end_listeners: x.memory.perRound[x.memory.perRound.length - 1].listeners, retained_listeners: x.memory.retainedListeners,
    end_dom: x.memory.perRound[x.memory.perRound.length - 1].counts.dom,
    unit_list_redraws: x.ui ? x.ui.updateUnitList : null, faction_panel_redraws: x.ui ? x.ui.updateFactionPanel : null,
    unit_card_renders: x.ui ? x.ui.renderUnitCard : null,
    gc_s: x.profile ? r1(x.profile.gcMs / 1000) : null,
  };
}));

// ── turn_times: every AI turn and choice, pooled ──
const allTurns = [], allPicks = [];
perf.forEach(p => { (p.report.aiPerf.decisions || []).forEach(d => allTurns.push(d)); (p.report.aiPerf.picks || []).forEach(d => allPicks.push(d)); });
const topPicks = topLevel(allPicks.concat([])).filter(p => true);
const ACTION_NAMES = { move: 'Move', charge: 'Charge', fallBack: 'Fall Back', advance: 'Advance', attack: 'Attack', ability: 'Ability',
  hqCommand: 'HQ command', pass: 'Pass', endActivation: 'End activation', castRite: 'Cast a spell', channelMana: 'Channel Mana',
  attachLeader: 'Attach leader', embark: 'Embark', disembark: 'Disembark' };
const PHASE_NAMES = { COMMAND: 'Command Phase', MOVEMENT: 'Movement Phase', ACTION: 'Action Phase' };
const SEAM_NAMES = { advanceMove: 'Advance square', takeGround: 'Take ground after a fight', preAttack: 'Before an attack',
  overwatch: 'Overwatch', chargeDeclared: 'Charge declared', missionPick: 'Secondary mission pick', missionDiscard: 'Mission discard',
  primaryMissionPick: 'Primary mission pick', designationChoice: 'Designation', debtOfBlood: 'Debt of Blood', gauntletObjective: 'Gauntlet objective',
  sinCultSelect: 'Sin cult choice', countercharge: 'Countercharge', strayShot: 'Stray shot target',
  tacticaChoice: 'Tactica (Miracle) choice', commandPhaseStart: 'Command Phase start', beforeMoraleTests: 'Before Morale Tests',
  reposition: 'Reposition square', commandPhase: 'Command Phase choice', wouldBeDestroyed: 'A unit about to be destroyed',
  counterchargeSquare: 'Countercharge square', forlornHope: 'Forlorn Hope' };
const GROUP_NAMES = { all: 'All turns', phase: 'Phase', action: 'Action chosen', choice: 'Deployment', seam: 'Reaction or choice' };
const row = (group, key, name, s) => ({ group, kind: GROUP_NAMES[group], key, name, n: s.n, mean_ms: Math.round(s.mean), median_ms: Math.round(s.median), p90_ms: Math.round(s.p90), p99_ms: Math.round(s.p99), max_ms: Math.round(s.max), total_s: r1(s.total / 1000) });
const by = (list, k) => list.reduce((o, x) => { (o[k(x)] = o[k(x)] || []).push(x.ms); return o; }, {});
const tt = [row('all', 'all-turns', 'Every AI turn', stats(allTurns.map(d => d.ms)))];
Object.entries(by(allTurns, d => d.phase)).forEach(([k, v]) => tt.push(row('phase', 'phase-' + k, PHASE_NAMES[k] || k, stats(v))));
Object.entries(by(allTurns, d => d.type || 'none')).forEach(([k, v]) => tt.push(row('action', 'action-' + k, ACTION_NAMES[k] || k, stats(v))));
const choices = allPicks.filter(p => p.kind !== 'primary' && p.kind !== 'secondary');  // the seam's record already holds them
Object.entries(by(choices.filter(p => p.kind === 'deploy'), () => 'deploy')).forEach(([k, v]) => tt.push(row('choice', 'choice-deploy', 'Deploying a unit', stats(v))));
Object.entries(by(choices.filter(p => p.kind === 'interjection'), p => p.seam || '?')).forEach(([k, v]) => tt.push(row('seam', 'seam-' + k, SEAM_NAMES[k] || k, stats(v))));
write('turn_times', tt.sort((a, b) => (a.group === b.group ? b.total_s - a.total_s : 0)));

// ── ai_stages ──
const STAGE_NAMES = {
  aiPrepareTurn: 'Turn set-up (posture, threats, missives)', aiComputeThreatMatrix: 'Threat matrix', aiAssignMissives: 'Missives (Command Phase)',
  aiDecideMovement: 'Movement decision', aiFindGlobalBest: 'Long-range planner', aiChooseDestination: 'Destination choice',
  aiChooseHQCommand: 'HQ command choice', aiChooseActionPhase: 'Action Phase choice', _aiEvalFallBack: 'Fall Back weighing',
  aiScoreDestination: 'Squares scored', _aiScoreChargeSquare: 'Charge squares scored',
};
const turnMs = allTurns.reduce((t, d) => t + d.ms, 0);
write('ai_stages', stageTable(allTurns).map(s => ({ stage: s.name, name: STAGE_NAMES[s.name] || s.name, s: r1(s.ms / 1000), share: pct(s.ms / turnMs), calls: s.calls,
  per_call_ms: s.ms ? Math.round(s.ms / s.calls) : null, per_turn: r1(s.calls / allTurns.length) })));

// ── slowest ──
const nameOf = (p, uid) => { const u = (p.report.units || []).find(x => x.uid === uid); return u ? u.name : null; };
const tagged = [];
perf.forEach(p => (p.report.aiPerf.decisions || []).forEach(d => tagged.push({ p, d, kind: 'turn' })));
perf.forEach(p => (p.report.aiPerf.picks || []).filter(d => d.kind === 'interjection' || d.kind === 'deploy').forEach(d => tagged.push({ p, d, kind: d.kind })));
write('slowest_turns', tagged.sort((a, b) => b.d.ms - a.d.ms).slice(0, 20).map((x, i) => {
  const parts = Object.entries(x.d.parts || {}).filter(([, c]) => c[0] > 0).sort((a, b) => b[1][0] - a[1][0]);
  return { rank: i + 1, battle: label(x.p), round: x.d.round, phase: PHASE_NAMES[x.d.phase] || x.d.phase,
    what: x.kind === 'turn' ? (ACTION_NAMES[x.d.type] || x.d.type) : (SEAM_NAMES[x.d.seam] || x.d.seam || x.kind),
    unit: x.d.uid != null ? nameOf(x.p, x.d.uid) : '', ms: Math.round(x.d.ms),
    stage: parts[0] ? (STAGE_NAMES[parts[0][0]] || parts[0][0]) : '', stage_ms: parts[0] ? Math.round(parts[0][1][0]) : null };
}));

// ── profile ──
const areaTot = {}, fnTot = {};
let profTotal = 0, gc = 0, idle = 0, program = 0, profiled = 0;
recs.forEach(x => {
  if (!x.profile) return;
  profiled++;
  profTotal += x.profile.totalMs; gc += x.profile.gcMs; idle += x.profile.idleMs; program += x.profile.programMs;
  x.profile.functions.forEach(f => {
    const k = f.name + '|' + (f.file || '') + '|' + f.line;
    const c = fnTot[k] || (fnTot[k] = { name: f.name, file: f.file || '', area: f.category, line: f.line, self: 0, total: 0 });
    c.self += f.selfMs; c.total += f.totalMs;
  });
});
const busy = profTotal - idle;
const AREA_NAMES = { 'rules engine': 'Rules engine', AI: 'AI code itself', UI: 'Game UI', other: 'Unattributed page code', 'report recorder': 'Report recorder', vendor: 'Vendor libraries' };
// Anonymous functions are named by the engine line they are on, where it can be found.
const html = fs.readFileSync(W + '/output/warfront-fantasy.html', 'utf8').split('\n');
const anonName = f => { const text = (html[f.line] || '').trim(); return text ? '(' + text.slice(0, 60) + ')' : '(anonymous)'; };
const anonFile = f => {
  const text = (html[f.line] || '').trim();
  if (!text) return '';
  const { execSync } = require('child_process');
  try {
    const hit = execSync(`grep -rlF ${JSON.stringify(text.slice(0, 60))} engine/`, { cwd: W, encoding: 'utf8' }).split('\n')[0];
    return hit || '';
  } catch (e) { return ''; }
};
// Anonymous functions with real time are given the engine file their line is in, then
// every function's own time is summed by area.
const { categoryOf } = require(W + '/scripts/battle_report/ai_perf.cjs');
const lineFile = {};
Object.values(fnTot).filter(f => f.name === '(anonymous)' && f.self >= 200).forEach(f => {
  if (!(f.line in lineFile)) lineFile[f.line] = anonFile(f);
  if (lineFile[f.line]) { f.file = lineFile[f.line]; f.area = categoryOf(f.file); }
});
Object.values(fnTot).forEach(f => { areaTot[f.area] = (areaTot[f.area] || 0) + f.self; });
const fns = Object.values(fnTot).sort((a, b) => b.self - a.self).slice(0, 30).map((f, i) => {
  const anon = f.name === '(anonymous)';
  return { rank: i + 1, fn: anon ? anonName(f) : f.name, file: f.file, area: AREA_NAMES[f.area] || f.area, self_s: r1(f.self / 1000), total_s: r1(f.total / 1000), self_share: pct(f.self / busy) };
});
const areas = Object.entries(areaTot).map(([k, v]) => ({ area: AREA_NAMES[k] || k, s: r1(v / 1000), share: pct(v / busy) }));
areas.push({ area: 'Garbage collection', s: r1(gc / 1000), share: pct(gc / busy) });
areas.push({ area: 'Browser internals', s: r1(program / 1000), share: pct(program / busy) });
write('profile_areas', areas.sort((a, b) => b.s - a.s));
write('profile_functions', fns);
// The AI's own calls by total time: where its turns spend their time.
const aiFns = Object.values(fnTot).filter(f => f.area === 'AI').sort((a, b) => b.total - a.total)
  .filter(f => !/^(takeAITurn|aiSchedule|aiChooseAction|_aiChooseActionForPhase|_aiPerformAction|_aiTakeAction|aiWithMoveEvalCache)$/.test(f.name))
  .slice(0, 16).map(f => ({ fn: f.name, file: f.file, total_s: r1(f.total / 1000), share: pct(f.total / busy) }));
write('ai_calls', aiFns);
write('profile_totals', [{ key: 'profile', battles: profiled, total_s: r1(profTotal / 1000), busy_s: r1(busy / 1000), idle_s: r1(idle / 1000), gc_s: r1(gc / 1000) }]);

// ── memory_rounds ──
const mem = [];
recs.forEach(x => x.memory.perRound.forEach((s, i) => mem.push({ battle: x.battle, step: i, label: s.label, at_s: r1(s.at / 1000),
  heap_mb: Math.round(s.heapUsed / MB), nodes_k: r1(s.nodes / 1000), listeners: s.listeners, dom_k: r1(s.counts.dom / 1000) })));
write('memory_rounds', mem);

// ── decision quality, per matchup, from every perf battle and both full batches ──
const d = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
function quality(report) {
  const q = { unitRounds: 0, idle: 0, idleNoAction: 0, idleHold: 0, idleMoved: 0, moves: 0, undone: 0, objRounds: 0, hover: 0, hoverVp: 0, held: 0,
    charges: 0, chargesFought: 0, chargeTargetLeft: 0, kept: 0, completed: 0, friendlyFire: 0 };
  const snaps = report.snaps;
  const at = r => snaps.find(s => s.label === (r === 1 ? 'deployment' : 'end of round ' + (r - 1)));
  for (let r = 1; r <= (report.result && report.result.round || 0); r++) {
    const s = at(r); if (!s) continue;
    q.unitRounds += s.units.filter(u => u.alive && u.col >= 0 && !u.isHQ && !(u.tags || []).includes('BUILDING')).length;
  }
  const act = activityRecord(report);
  act.rows.filter(x => !x.isHQ).forEach(x => {
    q.idle += x.idle; q.idleMoved += x.idleMoved;
    x.idleWhy.forEach(w => { if (w.action == null) q.idleNoAction++; else q.idleHold++; });
  });
  const t = tempoRecord(report);
  q.moves = t.rows.reduce((a, x) => a + x.moves, 0); q.undone = t.rows.reduce((a, x) => a + x.undone, 0);
  snaps.filter(s => /^end of round/.test(s.label) && s.round >= 2).forEach(s => {
    const alive = s.units.filter(u => u.alive && !u.isHQ && u.col >= 0);
    s.objectives.forEach(o => [0, 1].forEach(p => {
      q.objRounds++;
      const inA = alive.filter(u => d(u, o) <= 1);
      if (inA.some(u => u.player === p) && !inA.some(u => u.player !== p)) q.held++;
      if (!inA.length && alive.some(u => u.player === p && d(u, o) >= 2 && d(u, o) <= 3)) { q.hover++; q.hoverVp += o.vp; }
    }));
  });
  (report.moves || []).filter(m => m.charged && m.phase === 'MOVEMENT').forEach(ch => {
    q.charges++;
    const fought = (report.combats || []).some(c => c.round === ch.round && c.kind === 'melee' && c.attacker && c.attacker.uid === ch.uid);
    if (fought) q.chargesFought++;
    else if ((report.moves || []).some(m => m.round === ch.round && m.phase === 'MOVEMENT' && m.seq > ch.seq && m.player !== ch.player && d(m.from, ch.to) <= 1 && d(m.to, ch.to) > 1)) q.chargeTargetLeft++;
  });
  const sum = summarize(report);
  [0, 1].forEach(p => { q.kept += sum.missions[p].length; q.completed += sum.missions[p].filter(m => m.outcome === 'completed').length; });
  q.friendlyFire = (report.combats || []).filter(c => (c.losses || []).some(l => c.attacker && l.player === c.attacker.player && l.uid !== c.attacker.uid)).length;
  return q;
}
const qualityRow = (matchup, set, reports) => {
  const t = reports.map(quality).reduce((a, q) => { Object.keys(q).forEach(k => { a[k] = (a[k] || 0) + q[k]; }); return a; }, {});
  return { matchup, set, battles: reports.length, unit_rounds: t.unitRounds,
    idle_share: pct(t.idle / t.unitRounds), idle_no_action_share: pct(t.idleNoAction / t.unitRounds), idle_hold_share: pct(t.idleHold / t.unitRounds),
    moved_then_idle_share: pct(t.idleMoved / t.unitRounds), moves: t.moves, undone_share: pct(t.undone / t.moves),
    obj_rounds: t.objRounds, hover_share: pct(t.hover / t.objRounds), hover_vp_per_battle: r1(t.hoverVp / reports.length), held_share: pct(t.held / t.objRounds),
    charges: t.charges, charge_fought_share: pct(t.chargesFought / t.charges), charge_target_left_share: pct(t.chargeTargetLeft / t.charges),
    secondaries_completed_share: pct(t.completed / t.kept), friendly_fire_per_battle: r1(t.friendlyFire / reports.length) };
};
const qrows = [];
MATCHUPS.forEach(([dir, matchup]) => { const ps = perf.filter(p => p.dir === dir).map(p => p.report); if (ps.length) qrows.push(qualityRow(matchup, 'perf', ps)); });
qrows.push(qualityRow('Host vs Court (12)', 'full', games('host-vs-court-fix').map(g => g.report)));
qrows.push(qualityRow('Cohort vs Procession (12)', 'full', games('cohort-vs-procession-fix').map(g => g.report)));
const allQ = perf.map(p => p.report).concat(games('host-vs-court-fix').map(g => g.report), games('cohort-vs-procession-fix').map(g => g.report));
qrows.push(qualityRow('All battles', 'all', allQ));
write('quality', qrows);

// ── Fall Back verdicts and commands (full records) ──
const full = games('host-vs-court-fix').map(g => Object.assign({ label: 'hvc/' + g.file }, g)).concat(games('cohort-vs-procession-fix').map(g => Object.assign({ label: 'cvp/' + g.file }, g)));
const verdicts = {};
full.forEach(g => fallBackRecord(g.report, g.label).forEach(v => { verdicts[v.verdict] = (verdicts[v.verdict] || 0) + 1; }));
const VERDICT_NAMES = { sound: 'Fell back: sound', costly: 'Fell back: gave up objective VP', 'left a winning fight': 'Fell back from a winning fight', doubtful: 'Fell back: no danger, nothing gained',
  held: 'Stayed: held', 'risky hold': 'Stayed: risky hold', 'held to the end': 'Stayed: held to the end', 'should have left': 'Stayed: should have left', 'could not escape': 'Stayed: could not escape', 'caught by others': 'Stayed: struck by others' };
write('fallbacks', Object.entries(verdicts).map(([k, n]) => ({ verdict: VERDICT_NAMES[k] || k, n, good: ['sound', 'held', 'held to the end', 'could not escape', 'caught by others'].includes(k) })).sort((a, b) => b.n - a.n));
const uses = {};
full.forEach(g => effectsRecord(g.report, g.label).forEach(e => {
  const k = e.name;
  const c = uses[k] || (uses[k] = { use: k, kind: e.kind, uses: 0, nothing: 0, cp: 0, cp_nothing: 0, mana: 0 });
  c.uses++; if (e.verdict === 'nothing') { c.nothing++; c.cp_nothing += e.cost.cp || 0; } c.cp += e.cost.cp || 0; c.mana += e.cost.mana || 0;
}));
write('commands', Object.values(uses).map(c => Object.assign(c, { nothing_share: pct(c.nothing / c.uses) })).sort((a, b) => b.uses - a.uses).slice(0, 24));
const allUses = Object.values(uses).reduce((a, c) => ({ uses: a.uses + c.uses, nothing: a.nothing + c.nothing, cp: a.cp + c.cp, cp_nothing: a.cp_nothing + c.cp_nothing }), { uses: 0, nothing: 0, cp: 0, cp_nothing: 0 });
write('commands_total', [{ key: 'all', uses: allUses.uses, nothing: allUses.nothing, nothing_share: pct(allUses.nothing / allUses.uses), cp: allUses.cp, cp_nothing: allUses.cp_nothing, cp_nothing_share: pct(allUses.cp_nothing / allUses.cp), fallback_decisions: Object.values(verdicts).reduce((a, b) => a + b, 0) }]);

// ── before and after the three fixes (same seeds) ──
const morph = reports => {
  let rounds = 0, dmg = 0, moved = 0;
  reports.forEach(r => {
    const m = r.units.find(u => /Morphean/.test(u.name)); if (!m) return;
    rounds += r.result.round;
    (r.combats || []).filter(c => c.attacker && c.attacker.uid === m.uid).forEach(c => { dmg += (c.losses || []).filter(l => l.player !== m.player).reduce((s, l) => s + l.lost, 0); });
    moved += new Set((r.moves || []).filter(x => x.uid === m.uid && (x.to.col !== x.from.col || x.to.row !== x.from.row)).map(x => x.round)).size;
  });
  return { dmg_per_round: r2(dmg / rounds), moved_share: pct(moved / rounds) };
};
const chargeRate = (reports, re) => {
  let rounds = 0, charges = 0;
  reports.forEach(r => {
    const us = r.units.filter(u => re.test(u.name));
    us.forEach(u => {
      for (let k = 2; k <= r.result.round; k++) { const s = r.snaps.find(x => x.label === 'end of round ' + (k - 1)); const a = s && s.units.find(x => x.uid === u.uid); if (a && a.alive) rounds++; }
      charges += (r.moves || []).filter(m => m.uid === u.uid && m.charged).length;
    });
  });
  return r2(charges / rounds);
};
const fixes = [];
[['Host vs Court', 'host-vs-court', 'host-vs-court-fix'], ['Cohort vs Procession', 'cohort-vs-procession-dmg', 'cohort-vs-procession-fix']].forEach(([m, before, after]) => {
  const B = games(before).map(g => g.report), A = games(after).map(g => g.report);
  const qb = qualityRow(m, 'before', B), qa = qualityRow(m, 'after', A);
  fixes.push({ key: m + '|hover', matchup: m, metric: 'Objectives left empty with own units 2–3 squares off (share of objective-rounds)', fmt: 'pct', before: qb.hover_share, after: qa.hover_share, better: 'lower' });
  fixes.push({ key: m + '|hovervp', matchup: m, metric: 'Objective VP left that way, per battle', fmt: 'num', before: qb.hover_vp_per_battle, after: qa.hover_vp_per_battle, better: 'lower' });
  fixes.push({ key: m + '|held', matchup: m, metric: 'Objectives held uncontested (share of objective-rounds)', fmt: 'pct', before: qb.held_share, after: qa.held_share, better: 'higher' });
  fixes.push({ key: m + '|fought', matchup: m, metric: 'Charges that fought (share)', fmt: 'pct', before: qb.charge_fought_share, after: qa.charge_fought_share, better: 'higher' });
  if (m === 'Host vs Court') {
    fixes.push({ key: m + '|masque', matchup: m, metric: 'Masque of Carnality charges per round alive', fmt: 'num2', before: chargeRate(B, /^Masque/), after: chargeRate(A, /^Masque/), better: 'higher' });
    fixes.push({ key: m + '|assassin', matchup: m, metric: 'Babylonian Assassin charges per round alive', fmt: 'num2', before: chargeRate(B, /^Babylonian/), after: chargeRate(A, /^Babylonian/), better: 'higher' });
  } else {
    const mb = morph(B), ma = morph(A);
    fixes.push({ key: m + '|mdmg', matchup: m, metric: 'Morphean Engine damage per round (HP)', fmt: 'num2', before: mb.dmg_per_round, after: ma.dmg_per_round, better: 'higher' });
    fixes.push({ key: m + '|mmove', matchup: m, metric: 'Morphean Engine rounds spent moving (share)', fmt: 'pct', before: mb.moved_share, after: ma.moved_share, better: 'lower' });
  }
  const wins = rs => { const b = JSON.parse(fs.readFileSync(path.join(R, rs, 'batch.json'), 'utf8')); return b.games.filter(g => g && g.winner === 1).length; };
  fixes.push({ key: m + '|wins', matchup: m, metric: 'Battles won by the second army (of 12)', fmt: 'int', before: wins(before), after: wins(after), better: 'none' });
});
write('fixes', fixes);

// ── headline: the pooled figures the page's sentences quote ──
const H = [];
const add = (metric, value, unit, note) => H.push({ metric, value, unit: unit || '', note: note || '' });
const turnsS = stats(allTurns.map(t => t.ms));
const sum = (xs, f) => xs.reduce((a, x) => a + f(x), 0);
const mean = (xs, f) => (xs.length ? sum(xs, f) / xs.length : null);
add('battles', perf.length, '', 'lean, profiled battles timed');
add('turns', allTurns.length, '', 'AI turns timed');
add('choices', choices.length, '', 'other AI choices timed (reactions, deployment)');
add('turn_median_ms', Math.round(turnsS.median), 'ms'); add('turn_p90_ms', Math.round(turnsS.p90), 'ms');
add('turn_p99_ms', Math.round(turnsS.p99), 'ms'); add('turn_max_ms', Math.round(turnsS.max), 'ms');
add('ai_share_pct', pct(sum(recs, x => x.aiMs) / sum(recs, x => x.scriptMs)), '%', 'AI decision time over all JavaScript the page ran');
add('ai_s_per_battle', r1(mean(recs, x => x.aiMs) / 1000), 's'); add('wall_s_per_battle', r1(mean(recs, x => x.wallMs) / 1000), 's');
add('ai_s_per_round', r1(sum(recs, x => x.aiMs) / 1000 / sum(recs, x => x.rounds)), 's');
const passes = allTurns.filter(t => t.type === 'pass');
add('pass_mean_ms', Math.round(mean(passes, t => t.ms)), 'ms', 'a turn the AI passes');
add('passes_share_pct', pct(passes.length / allTurns.length), '%');
const st = stageTable(allTurns);
const stage = n => st.find(x => x.name === n) || { ms: 0, calls: 0 };
add('setup_share_pct', pct(stage('aiPrepareTurn').ms / turnMs), '%', 'turn set-up, run on every turn');
add('setup_mean_ms', Math.round(stage('aiPrepareTurn').ms / Math.max(1, stage('aiPrepareTurn').calls)), 'ms');
add('planner_share_pct', pct(stage('aiFindGlobalBest').ms / turnMs), '%');
add('squares_per_turn', r1(stage('aiScoreDestination').calls / allTurns.length), '');
const fnAll = Object.values(fnTot);
const fnTotal = n => sum(fnAll.filter(f => f.name === n), f => f.total);
add('posture_share_pct', pct(fnTotal('aiDeterminePosture') / busy), '%', 'of the busy page time');
add('threat_value_share_pct', pct(fnTotal('aiThreatValue') / busy), '%');
add('expected_damage_share_pct', pct(fnTotal('aiExpectedDamage') / busy), '%');
add('weapon_profile_share_pct', pct(sum(fnAll.filter(f => f.name === 'profile' && /core\/weapons/.test(f.file)), f => f.total) / busy), '%');
add('collect_effects_self_share_pct', pct(sum(fnAll.filter(f => f.name === 'collectCombatEffects'), f => f.self) / busy), '%');
add('ai_code_self_share_pct', pct((areaTot.AI || 0) / busy), '%', 'time in the AI\'s own code, not what it calls');
add('rules_self_share_pct', pct((areaTot['rules engine'] || 0) / busy), '%');
add('ui_self_share_pct', pct((areaTot.UI || 0) / busy), '%');
add('gc_share_pct', pct(gc / busy), '%');
const lts = recs.filter(x => x.longTasks);
add('long_tasks_per_battle', Math.round(mean(lts, x => x.longTasks.count)), '');
add('long_task_max_ms', Math.round(Math.max(...lts.map(x => x.longTasks.ms.max))), 'ms');
add('long_task_ai_pct', pct(sum(lts, x => x.longTasks.ai) / sum(lts, x => x.longTasks.count)), '%');
add('long_task_s_per_battle', r1(mean(lts, x => x.longTasks.ms.total) / 1000), 's');
add('start_mb', Math.round(mean(recs, x => x.memory.start) / MB), 'MB'); add('peak_mb', Math.round(mean(recs, x => x.memory.peak) / MB), 'MB');
add('peak_mb_max', Math.round(Math.max(...recs.map(x => x.memory.peak)) / MB), 'MB');
add('retained_mb', Math.round(mean(recs, x => x.memory.retained) / MB), 'MB');
const lastS = x => x.memory.perRound[x.memory.perRound.length - 1];
add('start_nodes_k', r1(mean(recs, x => x.memory.perRound[0].nodes) / 1000), 'k');
add('end_nodes_k', r1(mean(recs, x => lastS(x).nodes) / 1000), 'k'); add('retained_nodes_k', r1(mean(recs, x => x.memory.retainedNodes || 0) / 1000), 'k');
add('end_dom_k', r1(mean(recs, x => lastS(x).counts.dom) / 1000), 'k');
add('end_listeners', Math.round(mean(recs, x => lastS(x).listeners)), ''); add('retained_listeners', Math.round(mean(recs, x => x.memory.retainedListeners || 0)), '');
add('start_listeners', Math.round(mean(recs, x => x.memory.perRound[0].listeners)), '');
add('unit_list_redraws', Math.round(mean(recs.filter(x => x.ui), x => x.ui.updateUnitList)), '', 'per battle');
add('unit_list_self_share_pct', pct(sum(fns.filter(f => /units\/list\.js$/.test(f.file)), f => f.self_s * 1000) / busy), '%');
const all = qrows.find(q => q.set === 'all');
['idle_share', 'idle_no_action_share', 'idle_hold_share', 'moved_then_idle_share', 'undone_share', 'hover_share', 'held_share', 'charge_fought_share', 'charge_target_left_share', 'secondaries_completed_share']
  .forEach(k => add(k.replace(/_share$/, '_pct'), all[k], '%'));
add('quality_battles', all.battles, ''); add('friendly_fire_per_battle', all.friendly_fire_per_battle, '');
const ct = { uses: allUses.uses, nothing: allUses.nothing };
add('commands_nothing_pct', pct(ct.nothing / ct.uses), '%'); add('cp_nothing_pct', pct(allUses.cp_nothing / allUses.cp), '%'); add('command_uses', ct.uses, '');
const fbTotal = Object.values(verdicts).reduce((a, b) => a + b, 0);
const fbBad = ['costly', 'left a winning fight', 'doubtful', 'risky hold', 'should have left'].reduce((a, k) => a + (verdicts[k] || 0), 0);
add('fallback_decisions', fbTotal, ''); add('fallback_flagged_pct', pct(fbBad / fbTotal), '%');
write('headline', H);

// ── machine ──
const mach = recs[0] && recs[0].machine || {};
write('machine', [{ key: 'machine', cpu: mach.cpu, cores: mach.cores, memory_gb: Math.round((mach.memory || 0) / 1073741824), browser: mach.browser, node: mach.node,
  battles: perf.length, quality_battles: allQ.length }]);
