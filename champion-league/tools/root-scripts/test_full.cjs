#!/usr/bin/env node
'use strict';

// test_battle_report.cjs - the battle report's pure pieces: the numbers summarize.cjs
// works out of a recorded battle (each round's VP by source, CP and pool flows and
// what they bought, how each kept mission ended, the unit rankings, the rounds
// played) and the page build.cjs makes from them. No build and no Chrome; record.cjs
// plays a real battle.
//
//   node scripts/test_battle_report.cjs

const { summarize, describeResource } = require('./battle_report/summarize.cjs');
const { enrichCombats } = require('./battle_report/page/enrich.cjs');
const { buildPage } = require('./battle_report/build.cjs');
const { scoring, typeTable } = require('./battle_report/attribution.cjs');
const { livePage, liveRound } = require('./battle_report/live.cjs');
const { activityTypeTable } = require('./battle_report/activity.cjs');
const { fallBackRecord, decidingRound } = require('./battle_report/fallback.cjs');
const { effectsRecord, effectsTable } = require('./battle_report/effects.cjs');
const { passivesRecord, passivesTable } = require('./battle_report/passives.cjs');
const { closestGame, replayCommand } = require('./battle_report/batch.cjs');
const { EFFECTS_FILES } = require('./battle_report/record.cjs');
const { tempoRecord, tempoLine, unitTempo, tempoTypeTable } = require('./battle_report/tempo.cjs');
const { stats, topLevel, aiPerfRecord, aiPerfBatch, categoryOf } = require('./battle_report/ai_perf.cjs');
const { summarizeProfile } = require('./battle_report/perf_probe.cjs');
const bracket = require('./battle_report/tournament_bracket.cjs');
const { roundSummary } = require('./battle_report/tournament.cjs');
const os = require('os');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// page_attribution.js runs in the game page; its Shapley value is pure, so it runs here too.
const pageAttribution = (() => {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_attribution.js'), 'utf8'), sandbox);
  return sandbox;
})();

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL ${name}: ${err && err.message ? err.message : err}`);
  }
}
function assert(condition, message) { if (!condition) throw new Error(message); }
function same(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const card = (name, extra) => Object.assign({ id: name.toLowerCase(), name, objective: name + ' text', reward_vp: 2, reward_cp: 0, duration: 2 }, extra);
const unit = (uid, name, player, rp, extra) => Object.assign({ uid, name, player, rp, isHQ: false, character: false, templateId: 'x:' + uid, tags: [] }, extra);
const playerState = (vp, cp, extra) => Object.assign({ vp, cp, pools: { mana: 0 }, missions: [], completed: [], discarded: [], primary: null }, extra);
const snapUnits = alive => [unit(1, 'Alpha', 0, 20), unit(2, 'Bravo', 0, 30), unit(3, 'Xray', 1, 40), unit(4, 'Yankee', 1, 10)]
  .map(u => Object.assign(u, { col: 1, row: 1, alive: alive.includes(u.uid), hp: 5, maxHp: 5, models: 1, statuses: [] }));

// Two Battle Rounds; the battle ends inside the second (no "end of round 2" snapshot).
function fixture() {
  const primary = { id: 'p', name: 'PRIMARY', objective: 'Hold', ladder: [], vp: 3, roundCap: 3, gameCap: 10 };
  return {
    meta: { map: 'TEST', mode: 'seize_the_ground', seed: 7, initiative: 0, factions: ['f0', 'f1'], doctrines: ['D0', 'D1'],
      sides: [{ faction: 'f0', formation: 'preset:a' }, { faction: 'f1', formation: 'preset:b' }], armyNames: ['Army A', 'Army B'], factionNames: ['F0', 'F1'],
      armies: [[unit(1, 'Alpha', 0, 20, { models: 1, hp: 5 }), unit(2, 'Bravo', 0, 30, { models: 1, hp: 5 })],
        [unit(3, 'Xray', 1, 40, { models: 1, hp: 5 }), unit(4, 'Yankee', 1, 10, { models: 1, hp: 5 })]] },
    result: { winner: 0, reason: 'VP', round: 2, vp: [9, 1] },
    snaps: [
      { label: 'deployment', round: 1, image: null, cols: 4, rows: 4, players: [playerState(0, 0), playerState(0, 0)], units: snapUnits([1, 2, 3, 4]) },
      { label: 'end of round 1', round: 1, image: null, cols: 4, rows: 4, units: snapUnits([1, 2, 3]),
        players: [playerState(3, 1, { missions: [card('HOLD', { turnsLeft: 1 })] }), playerState(1, 2)] },
      { label: 'final', round: 2, image: null, cols: 4, rows: 4, units: snapUnits([1, 3]),
        players: [playerState(9, 0, { primary, completed: [card('HOLD', { completedRound: 2 })],
          discarded: [card('RUN', { discardReason: 'NOT PICKED' }), card('RUN', { discardReason: 'EXPIRED (R2)' })] }), playerState(1, 2)] },
    ],
    moves: [{ seq: 1, round: 1, phase: 'MOVEMENT', uid: 1, name: 'Alpha', player: 0, from: { col: 0, row: 0 }, to: { col: 1, row: 1 } }],
    combats: [
      { seq: 2, round: 1, phase: 'ACTION', kind: 'ranged', attacker: { uid: 1, name: 'Alpha', player: 0, at: { col: 1, row: 1 } },
        target: { uid: 4, name: 'Yankee', player: 1, at: { col: 2, row: 2 } }, losses: [{ uid: 4, name: 'Yankee', player: 1, lost: 5, killed: true, at: { col: 2, row: 2 } }] },
      { seq: 9, round: 2, phase: 'ACTION', kind: 'magic', label: 'Fireball', attacker: { uid: 3, name: 'Xray', player: 1, at: { col: 2, row: 2 } },
        target: { uid: 2, name: 'Bravo', player: 0, at: { col: 1, row: 2 } }, losses: [{ uid: 2, name: 'Bravo', player: 0, lost: 5, killed: true, at: { col: 1, row: 2 } }] },
    ],
    resources: [
      { seq: 3, round: 1, phase: 'COMMAND', kind: 'cp', player: 0, delta: 2, total: 2, note: 'COMMAND bonus: Player A gains +2 CP from 2 COMMAND unit(s)' },
      { seq: 4, round: 1, phase: 'COMMAND', kind: 'cp', player: 0, delta: -1, total: 1, note: 'HQ Command: Scouting Order -> Alpha (cost 1 CP) by Player A' },
      { seq: 5, round: 1, phase: 'CLEANUP', kind: 'vp', player: 0, delta: 3, total: 3, source: 'objectives' },
      { seq: 6, round: 1, phase: 'CLEANUP', kind: 'vp', player: 1, delta: 1, total: 1, source: 'objectives' },
      { seq: 7, round: 2, phase: 'ACTION', kind: 'vp', player: 0, delta: 2, total: 5, source: 'mission:HOLD' },
      { seq: 8, round: 2, phase: 'COMMAND', kind: 'pool', pool: 'mana', player: 1, delta: 2, total: 2, note: 'Radiance' },
      { seq: 10, round: 2, phase: 'ACTION', kind: 'pool', pool: 'mana', player: 1, delta: -2, total: 0, note: 'spent' },
      { seq: 11, round: 2, phase: 'CLEANUP', kind: 'vp', player: 0, delta: 4, total: 9, source: 'primary' },
    ],
    primary: { offers: [{ player: 0, canMulligan: true, picked: 'p', cards: [{ id: 'p', name: 'PRIMARY', fits: true }] }],
      scores: [{ round: 2, player: 0, id: 'p', vp: 3, total: 3, count: 4 }] },
    missions: [{ round: 1, player: 0, kept: 'HOLD', offered: ['HOLD', 'RUN'] }, { round: 2, player: 0, kept: 'RUN', offered: ['RUN'] }],
    log: [],
    units: [
      unit(1, 'Alpha', 0, 20, { alive: true, stats: { totalDmgDealt: 5, totalDmgTaken: 0, kills: [{ uid: 4, name: 'Yankee', round: 1 }], modelsKilled: 1 } }),
      unit(2, 'Bravo', 0, 30, { alive: false, stats: { totalDmgDealt: 0, kills: [] } }),
      unit(3, 'Xray', 1, 40, { alive: true, stats: { totalDmgDealt: 5, kills: [{ uid: 2, name: 'Bravo', round: 2 }], modelsKilled: 1 } }),
      unit(4, 'Yankee', 1, 10, { alive: false, stats: { totalDmgDealt: 0, kills: [] } }),
    ],
    errors: [],
  };
}

console.log('[BATTLE-REPORT] summarize');

check('a battle that ends inside a round counts that round', () => {
  same(summarize(fixture()).rounds, [1, 2], 'rounds');
  const ended = fixture();
  ended.snaps.splice(2, 0, Object.assign({}, ended.snaps[2], { label: 'end of round 2' }));
  ended.snaps[3] = Object.assign({}, ended.snaps[3], { round: 3 });
  same(summarize(ended).rounds, [1, 2], 'a final snapshot after the last round adds no round');
});

check('VP each round is split by source, and the total is the snapshot\'s', () => {
  const e = summarize(fixture()).economy;
  same(e[0].players[0].vp, { total: 3, objectives: 3, primary: 0, missions: 0, other: 0 }, 'round 1');
  same(e[1].players[0].vp, { total: 9, objectives: 0, primary: 4, missions: 2, other: 0 }, 'round 2');
});

check('CP and pools: gained, spent, held, and what each spend bought', () => {
  const e = summarize(fixture()).economy;
  const cp = e[0].players[0].cp;
  same([cp.gained, cp.spent, cp.held], [2, 1, 1], 'CP flow');
  same(cp.spends.map(s => s.what), ['Scouting Order → Alpha'], 'CP spend');
  same(cp.gains.map(s => s.what), ['Command income (2 COMMAND units)'], 'CP gain');
  const mana = e[1].players[1].pools.mana;
  same([mana.gained, mana.spent], [2, 2], 'mana flow');
  same(mana.spends.map(s => s.what), ['Cast Fireball'], 'a pool spent inside a cast is the rite\'s');
});

check('reaction commands and mission rewards are named', () => {
  const report = fixture();
  same(describeResource(report, { kind: 'cp', note: 'REACTION COMMAND: GO TO GROUND via HQ (cost 1 CP) - Fulminator Squad' }), 'Go to ground (reaction) for Fulminator Squad', 'reaction');
  same(describeResource(report, { kind: 'cp', note: 'MISSION COMPLETE: "STRONGPOINT" -> Player A +1 VP +1 CP!' }), 'Mission reward: STRONGPOINT', 'reward');
  same(describeResource(report, { kind: 'cp', note: 'HQ Command: Troop Requisition -> x:4 (cost 2 CP) by Player B' }), 'Troop Requisition → Yankee', 'a requisition names the unit it makes');
});

check('each kept card ends once: completed, expired - a card left unpicked is not the one kept', () => {
  const m = summarize(fixture()).missions[0];
  same(m.map(x => [x.name, x.keptRound, x.outcome, x.outcomeRound]), [['HOLD', 1, 'completed', 2], ['RUN', 2, 'expired', 2]], 'outcomes');
});

check('the leaderboard ranks damage, kills, the costliest kill and damage per RP', () => {
  const lb = summarize(fixture()).leaderboard;
  same(lb.damage.slice(0, 2).map(r => r.name), ['Alpha', 'Xray'], 'damage: tied on damage and kills, by name');
  same(lb.topKill[0].name, 'Xray', 'Xray destroyed Bravo (30 RP), Alpha Yankee (10 RP)');
  same(lb.topKill[0].topKill, { name: 'Bravo', rp: 30, round: 2 }, 'top kill');
  same(lb.perRp[0].name, 'Alpha', 'Alpha dealt 5 for 20 RP, Xray 5 for 40');
  same(lb.perRp[0].perRp, 0.25, 'per RP');
});

check('a unit that arrives with a name its side already has takes a suffix by order of arrival, in every table', () => {
  // Troop Requisition's Covenant Levies shared their original's name: two "Covenant
  // Levies" rows (Champion League D1-M19, D1-M24).
  const report = fixture();
  report.meta.armies[1][1].name = 'Levies';                                        // uid 4, deployed
  report.units[3].name = 'Levies';
  report.units.push(unit(5, 'Levies', 1, 10, { alive: true, stats: { totalDmgDealt: 2, kills: [{ uid: 2, name: 'Bravo', round: 2 }] } }));
  report.units.push(unit(6, 'Cantor', 1, 5, { alive: true, stats: { totalDmgDealt: 0, kills: [] } }));
  const final = report.snaps[2];
  final.units.push(Object.assign(unit(5, 'Levies', 1, 10), { col: 2, row: 2, alive: true, hp: 5, maxHp: 5, models: 1, statuses: [], joinedCharacter: 'Cantor' }),
    Object.assign(unit(6, 'Cantor', 1, 5), { col: 2, row: 2, alive: true, hp: 2, maxHp: 2, models: 1, statuses: [], joinedSquad: 'Levies' }));
  report.moves.push({ seq: 12, round: 2, phase: 'MOVEMENT', uid: 5, name: 'Levies', player: 1, partner: 'Cantor', from: { col: 1, row: 2 }, to: { col: 2, row: 2 } });
  report.combats.push({ seq: 13, round: 2, phase: 'ACTION', kind: 'melee', attacker: { uid: 5, name: 'Levies', player: 1 },
    target: { uid: 1, name: 'Alpha', player: 0 }, losses: [{ uid: 5, name: 'Levies', player: 1, lost: 1, killed: false }] });
  const s = summarize(report);
  same(s.leaderboard.rows.filter(r => r.player === 1).map(r => r.name), ['Xray', 'Levies', 'Levies #2', 'Cantor'], 'the arrival takes #2');
  same([report.combats[2].attacker.name, report.combats[2].losses[0].name, report.moves[1].name], ['Levies #2', 'Levies #2', 'Levies #2'], 'and every record names it so');
  same([final.units.find(u => u.uid === 6).joinedSquad, report.units.find(u => u.uid === 4).name], ['Levies #2', 'Levies'], 'its CHARACTER names it too; the original keeps its name');
  summarize(report);
  same(report.units.map(u => u.name), ['Alpha', 'Bravo', 'Xray', 'Levies', 'Levies #2', 'Cantor'], 'named once');
});

check('armies: RP fielded, arrived and lost, units lost', () => {
  const a = summarize(fixture()).armies;
  same([a[0].rp, a[0].lostRp, a[0].lostUnits], [50, 30, 1], 'army A');
  same([a[1].rp, a[1].lostRp, a[1].lostUnits], [50, 10, 1], 'army B');
  const report = fixture();
  report.units.push(unit(5, 'Zulu', 1, 17, { alive: false, stats: { totalDmgDealt: 0, kills: [] } }));
  const b = summarize(report).armies[1];
  same([b.arrivedUnits, b.arrivedRp, b.fieldedRp, b.lostRp, b.lostUnits], [1, 17, 67, 27, 2], 'a requisitioned unit arrives, and its loss counts');
});

check('a failed Fall Back logged model by model is one named effect; a Movement Phase shot is an Overwatch', () => {
  const report = fixture();
  report.log = [
    { round: 1, phase: 'MOVEMENT', msg: '[Bravo] FALL BACK TEST: INI 5 against 5, needs 5+, rolled 1 - FAILED' },
    { round: 1, phase: 'MOVEMENT', msg: '  Bravo trooper destroyed' },
    { round: 1, phase: 'MOVEMENT', msg: '  Bravo leader destroyed' },
  ];
  const loss = (lost, killed) => [{ uid: 2, name: 'Bravo', player: 0, lost, killed }];
  report.combats = [
    { seq: 20, round: 1, phase: 'MOVEMENT', kind: 'effect', label: '  Bravo trooper destroyed', attacker: null, target: null, losses: loss(2, false) },
    { seq: 21, round: 1, phase: 'MOVEMENT', kind: 'effect', label: '  Bravo leader destroyed', attacker: null, target: null, losses: loss(1, true) },
    { seq: 22, round: 1, phase: 'MOVEMENT', kind: 'ranged', attacker: { uid: 3, name: 'Xray', player: 1 }, target: { uid: 1, name: 'Alpha', player: 0 }, losses: [] },
  ];
  enrichCombats(report);
  same(report.combats.map(c => c.label), ['Fall Back in disorder', 'Overwatch'], 'labels');
  same(report.combats[0].losses, [{ uid: 2, name: 'Bravo', player: 0, lost: 3, killed: true }], 'merged losses');
});

check('an untagged loss is read at its own log line, not the first line with its text', () => {
  // "Bravo trooper destroyed" is logged inside Bravo's attack, inside Xray's Fireball, and
  // by the BURNED tick at the phase's end. Read at the first, the tick was Xray's Shield Wall.
  const L = (msg, phase) => ({ round: 1, phase: phase || 'ACTION', msg });
  const run = withIndex => {
    const report = fixture();
    report.log = [
      L('Xray uses Shield Wall!'),                        // 0
      L('Bravo opens fire with 1 combat group'),          // 1
      L('  Bravo trooper destroyed'),                     // 2  inside Bravo's attack
      L('Xray casts Fireball'),                           // 3
      L('  Bravo trooper destroyed'),                     // 4  inside the Fireball
      L('Player B passes ACTION phase'),                  // 5
      L('  Bravo trooper destroyed'),                     // 6  the BURNED tick
      L('[Bravo] BURNED: 2 True Damage (1 stack x 2)'),  // 7
      L('Mana: Player B +6 (6 total) - Channel Mana'),    // 8
      L('Xray channels Mana: +6'),                        // 9
      L('Xray uses Shield Wall!'),                        // 10
      L('Alpha opens fire with 1 combat group'),          // 11
      L('  Charlie loses its banner'),                    // 12 after Alpha opens: no ability's
      L('Yankee fires 1 combat group at 4,4'),            // 13
      L('  Charlie SAVE roll: 1 (needs 4+) => FAILED'),   // 14 the blast's, unrecorded once
      L('  Charlie trooper destroyed', 'MOVEMENT'),       // 15 a charge's impact
      L('[Charlie] FALL BACK TEST: INI 1 against 5, needs 6+, rolled 2 - FAILED', 'MOVEMENT'),
      L('  Charlie trooper destroyed', 'MOVEMENT'),       // 17 inside the Fall Back's own record
    ];
    const loss = (uid, name) => [{ uid, name, player: 0, lost: 1, killed: false }];
    const effect = (seq, line, uid, name, phase) => Object.assign({ seq, round: 1, phase: phase || 'ACTION', kind: 'effect',
      label: report.log[line].msg, attacker: null, target: null, losses: loss(uid, name) }, withIndex ? { logIndex: line } : {});
    report.combats = [
      { seq: 30, round: 1, phase: 'ACTION', kind: 'ranged', attacker: { uid: 2, name: 'Bravo', player: 0 }, target: { uid: 3, name: 'Xray', player: 1 }, losses: [] },
      { seq: 31, round: 1, phase: 'ACTION', kind: 'magic', label: 'Fireball', attacker: { uid: 3, name: 'Xray', player: 1 }, target: { uid: 2, name: 'Bravo', player: 0 }, losses: [] },
      effect(32, 6, 2, 'Bravo'),
      { seq: 33, round: 1, phase: 'ACTION', kind: 'ranged', attacker: { uid: 1, name: 'Alpha', player: 0 }, target: { uid: 4, name: 'Yankee', player: 1 }, losses: [] },
      effect(34, 12, 5, 'Charlie'),
      effect(35, 14, 5, 'Charlie'),
      effect(36, 15, 5, 'Charlie', 'MOVEMENT'),
      { seq: 37, round: 1, phase: 'MOVEMENT', kind: 'effect', label: 'Fall Back in disorder', attacker: null, target: { uid: 5, name: 'Charlie', player: 0 }, losses: loss(5, 'Charlie') },
    ];
    enrichCombats(report);
    return report.combats.filter(c => c.seq >= 32 && c.seq !== 33).map(c => [c.seq, c.kind, c.label, c.attacker && c.attacker.name]);
  };
  // The tick is Burning; a loss after another unit's attack opens is no ability's; the
  // charge's impact before a failed Fall Back test is not the Fall Back's; a blast left
  // unrecorded is its attacker's, while a record made since records it itself.
  const want = blast => [[32, 'effect', 'Burning', null], [34, 'effect', '  Charlie loses its banner', null], blast,
    [36, 'effect', '  Charlie trooper destroyed', null], [37, 'effect', 'Fall Back in disorder', null]];
  same(run(true), want([35, 'effect', '  Charlie SAVE roll: 1 (needs 4+) => FAILED', null]), 'with the recorder\'s log index');
  same(run(false), want([35, 'ranged', null, 'Yankee']), 'an older record, each run of losses taking the last lines before the next record');
});

check('an affliction tick is named by its own summary, not a BURNED line beside it', () => {
  // The Mobad's POISONED tick came three lines after the Cultists' BURNED one and was
  // drawn as Burning (Host vs Court, Round 3).
  const L = (msg, phase) => ({ round: 1, phase: phase || 'ACTION', msg });
  const report = fixture();
  report.log = [
    L('  Cultist destroyed'),                                   // 0  the burn's loss
    L('[Cultists] BURNED: 6 True Damage (2 stacks x 3)'),       // 1
    L('  Mobad SAVES (slow roll): [no save->Mobad]'),           // 2  the poison's loss
    L('[Mobad] POISONED: 1 True Damage (1 stack x 1)'),         // 3
    L('  Masque SAVES (slow roll): [no save->Masque]', 'CLEANUP'), // 4  the field's loss
    L('[Masque] BURNING FIELD: 1 True Damage + BURNED (5 HP)', 'CLEANUP'),
  ];
  const tick = (seq, line, name, phase) => ({ seq, round: 1, phase: phase || 'ACTION', kind: 'effect', label: report.log[line].msg,
    attacker: null, target: null, logIndex: line, losses: [{ uid: seq, name, player: 0, lost: 1, killed: false }] });
  report.combats = [tick(40, 0, 'Cultists'), tick(41, 2, 'Mobad'), tick(42, 4, 'Masque', 'CLEANUP')];
  enrichCombats(report);
  same(report.combats.map(c => c.label), ['Burning', 'Poison', 'Burning'], 'labels');
});

console.log('[BATTLE-REPORT] recorder');

// page_recorder.js in a page of its own, the engine stubbed: `units` on the board, each
// { uid, name, player, hp }, and `extra` engine functions. Returns the page, the record
// installed.
function recorderPage(units, extra) {
  const page = { console, Math, JSON, Object, Number, String, Array };
  page.window = page;
  vm.createContext(page);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_recorder.js'), 'utf8'), page);
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 1, units, players: [{ vp: 0, cp: 0 }, { vp: 0, cp: 0 }], objectives: [], combatLog: [], formations: [] },
    unitCurrentHP: u => u.hp, unitMaximumHP: u => u.maxHp || 10, unitRpCost: u => u.rp || 0, isStructure: () => false,
    Models: { alive: u => (u.alive ? [{}] : []) }, unitByUid: uid => units.find(u => u.uid === uid),
    getBoardDimensions: () => ({ cols: 4, rows: 4 }), battleLog: msg => { page.G.combatLog.push({ msg }); },
    endCleanupPhase: () => {}, phaseFlowInitBattle: () => {}, showVictory: () => {}, placeFootprint: () => {},
  }, extra || {});
  const warn = console.warn; console.warn = () => {};
  try { page.installBattleRecorder({ images: false }); } finally { console.warn = warn; }
  return page;
}

check('a round\'s snapshot holds the pools its end paid: a deed ladder pays as the Cleanup Phase ends', () => {
  // Pietas is paid inside endCleanupPhase, after the board is read: the digest said
  // "holds 0" in a round whose log paid 4 (Champion League D1-M02, M04, M13).
  const pools = [{ pietas: 0 }, { pietas: 0 }];
  const page = recorderPage([], {
    FACTION_RESOURCE_POOLS: { pietas: {} }, holdsResourcePool: () => true, getPool: (id, p) => pools[p][id],
    runResourcePoolLadderRoundEnd: () => { pools[0].pietas += 4; },
    runResourcePoolRoundEnd: () => { pools[1].pietas += 1; },
    endCleanupPhase: () => { page.runResourcePoolLadderRoundEnd(); page.runResourcePoolRoundEnd(); page.G.round += 1; },
  });
  page.G.battlePhase = 'CLEANUP';
  page.endCleanupPhase();
  pools[0].pietas = 9;   // spent and refilled later: the snapshot keeps the round's end
  const snap = page.__battleRecord.snaps[0];
  same([snap.label, snap.round, snap.players.map(p => p.pools.pietas)], ['end of round 1', 1, [4, 1]], 'the round\'s end, paid');
});

check('damage no attack carries is credited to the unit behind it and named by its rule; friendly fire is the engine\'s own credit', () => {
  // A BURNED tick from Armor of Cold Flame, a plague's tick and Lance of God's Wrath on a
  // charge were credited to no unit and labelled by a log line beside them (Champion League
  // D1-M09, D1-M11, D1-M06); the Centaur's stray shot counted in its damage (D1-M07).
  const mk = (uid, name, player) => ({ uid, name, player, hp: 10, alive: true, col: uid, row: 1, statuses: [], battleStats: { totalDmgDealt: 0, totalDmgTaken: 0, kills: [] } });
  const knight = mk(1, 'Knight-Excisors', 0), wardens = mk(2, 'Sidhe Wardens', 1), monarch = mk(3, 'Plague Monarch', 1);
  const riflemen = mk(4, 'Etxe Riflemen', 0), hussars = mk(5, 'Hussars', 0), centaur = mk(6, 'Centaur', 1), acolytes = mk(7, 'Acolytes', 1);
  const units = [knight, wardens, monarch, riflemen, hussars, centaur, acolytes];
  let page = null;
  // The engine's own bookkeeping, as combat/battle_tracking.js keeps it.
  const hurt = (attacker, unit, n) => {
    const lost = Math.min(n, unit.hp);
    unit.hp -= lost;
    if (!unit.hp) unit.alive = false;
    page._recordBattleDmg(attacker, unit, lost);
  };
  page = recorderPage(units, {
    _recordBattleDmg: (a, t, n) => { if (a) a.battleStats.totalDmgDealt += n; t.battleStats.totalDmgTaken += n; },
    _recordBattleKill: (k, v) => { if (k) k.battleStats.kills.push({ uid: v.uid, name: v.name }); },
    statusDef: key => ({ damage_over_time: key === 'BURNED' ? {} : null }),
    applyStatus: (unit, key) => { unit.statusStacks = unit.statusStacks || {}; (unit.statusStacks[key] = unit.statusStacks[key] || []).push(page.G.round + 1); return true; },
    applyAffliction: (unit, id) => { (unit.afflictions = unit.afflictions || []).push({ affliction: id, expiresRound: 2 }); return true; },
    ABILITY_OPS: {
      deal_damage: (effect, ctx) => { ctx.targets.forEach(t => hurt(effect.no_attacker ? null : ctx.unit, t, effect.amount)); return { ok: true }; },
      apply_status: (effect, ctx) => { ctx.targets.forEach(t => page.applyStatus(t, effect.status)); return { ok: true }; },
      apply_affliction: (effect, ctx) => { ctx.targets.forEach(t => page.applyAffliction(t, 'GLUTTONS_MAW')); return { ok: true }; },
    },
    runOp: (effect, ctx) => page.ABILITY_OPS[effect.op](effect, ctx),
    // The Wardens strike the Knights, whose Armor of Cold Flame answers with BURNED; the
    // Centaur's counterattack, a strike of its own, puts its ABLAZE BURNED on the Hussars.
    resolveMeleeAttack: (a, d) => {
      hurt(a, d, 2);
      if (d === knight) page.runOp({ op: 'apply_status', status: 'BURNED' }, { unit: d, targets: [a], sourceName: 'Armor of Cold Flame', source: 'ability:blf_armor_of_cold_flame' });
      else page._resolveMeleeStrike(d, a);
      return {};
    },
    _resolveMeleeStrike: (striker, struck) => { page.applyStatus(struck, 'BURNED'); return {}; },
    // The Centaur's shot strays into its own Acolytes.
    resolveCompositionRangedAttack: (a) => { hurt(a, acolytes, 4); return {}; },
    _statusDotTickUnit: (u) => { hurt(null, u, 9); if (!u.alive) page._recordBattleKill(null, u); },
    useAbility: (u, name, t) => page.runOp({ op: 'apply_affliction' }, { unit: u, targets: [t], sourceName: name }),
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_credit.js'), 'utf8'), page);
  page.installCreditRecorder(page.__battleRecord);
  page.resolveMeleeAttack(wardens, knight);
  page.resolveCompositionRangedAttack(centaur, wardens);
  page.useAbility(monarch, 'Benediction of Beelzebub', riflemen);
  page.G.battlePhase = 'MOVEMENT';
  page.runOp({ op: 'deal_damage', amount: 1, no_attacker: true, source: "Glutton's Maw" },
    { unit: riflemen, targets: [riflemen], source: 'affliction:GLUTTONS_MAW', sourceName: "Glutton's Maw", mode: 'event' });
  page.runOp({ op: 'deal_damage', amount: 3, source: "Lance of God's Wrath" }, { unit: hussars, targets: [wardens], sourceName: "Lance of God's Wrath" });
  page.G.battlePhase = 'ACTION';
  page.resolveMeleeAttack(hussars, centaur);
  page._statusDotTickUnit(wardens, 'BURNED');
  page._statusDotTickUnit(hussars, 'BURNED');
  const R = page.__battleRecord;
  same(R.combats.filter(c => c.named).map(c => [c.kind, c.label, c.rule, c.attacker && c.attacker.name, c.losses.map(l => [l.name, l.lost, l.killed])]),
    [['effect', "Glutton's Maw", "Glutton's Maw", 'Plague Monarch', [['Etxe Riflemen', 1, false]]],
      ['ability', "Lance of God's Wrath", "Lance of God's Wrath", 'Hussars', [['Sidhe Wardens', 3, false]]],
      ['effect', 'BURNED', 'Armor of Cold Flame', 'Knight-Excisors', [['Sidhe Wardens', 7, true]]],
      ['effect', 'BURNED', undefined, 'Centaur', [['Hussars', 9, false]]]], 'each named, by the unit behind it - a counterattack\'s by its striker');
  same(R.credits.map(c => [c.by, c.src, c.target, c.kill ? 'kill' : c.hp]),
    [[2, null, 1, 2], [6, null, 7, 4], [null, 3, 4, 1], [5, null, 2, 3], [5, null, 6, 2], [null, 1, 2, 7], [null, 1, 2, 'kill'], [null, 6, 5, 9]], 'the engine\'s credit, and the unit behind what it gave no one');
  same(R.actors, [], 'every call put its actor back');
  // The record's tables read the ledger.
  const report = fixture();
  report.meta.armies = [units.filter(u => u.player === 0), units.filter(u => u.player === 1)].map(side => side.map(u => unit(u.uid, u.name, u.player, 10)));
  report.units = units.map(u => unit(u.uid, u.name, u.player, 10, { alive: u.alive, stats: u.battleStats }));
  report.combats = R.combats;
  report.credits = R.credits;
  const s = summarize(report);
  const row = name => s.leaderboard.rows.find(r => r.name === name);
  same([row('Centaur').dealt, row('Centaur').friendly], [9, 4], 'the stray shot is friendly fire, not damage dealt');
  same([row('Knight-Excisors').dealt, row('Knight-Excisors').kills], [7, 1], 'the Knights\' armour is credited with the BURNED tick and its kill');
  same(row('Plague Monarch').dealt, 1, 'the Monarch with the plague it handed out');
  same(s.leaderboard.friendly.map(r => r.name), ['Centaur'], 'friendly fire ranked apart');
  same([s.attrition[0].dealt, s.attrition[0].friendly], [[12, 12], [0, 4]], 'R1: what each side dealt, its own losses apart');
  report.log = [{ round: 1, phase: 'MOVEMENT', msg: "Glutton's Maw" }];
  enrichCombats(report);
  same(report.combats.filter(c => c.named).map(c => c.label), ["Glutton's Maw", "Lance of God's Wrath", 'Burning', 'Burning'], 'a status by the name the page draws; no log line read for them');
});

console.log('[BATTLE-REPORT] page');

check('the page builds without commentary and shows every section', () => {
  const html = buildPage({ report: fixture() });
  ['id="numbers"', 'id="round-1"', 'id="round-2"', 'id="missions"', 'id="economy"', 'id="leaderboard"', 'id="analysis"', 'Cast Fireball', 'Army A']
    .forEach(text => assert(html.includes(text), 'missing ' + text));
});

check('the page is published without a document skeleton; --standalone adds one', () => {
  const page = buildPage({ report: fixture(), commentary: { title: 'Test Battle' } });
  assert(page.startsWith('<title>Test Battle</title>'), 'starts with its title');
  assert(!/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(page), 'no skeleton of its own');
  assert(/^<!doctype html>[\s\S]*<body>[\s\S]*<title>Test Battle<\/title>/.test(buildPage({ report: fixture(), commentary: { title: 'Test Battle' }, standalone: true })), 'standalone document');
});

check('the analysis places charts, and names the ids when one is unknown', () => {
  const html = buildPage({ report: fixture(), commentary: { analysis: { html: '<p>x</p>{{chart:attrition}}' } } });
  assert(html.includes('id="chart-attrition"'), 'attrition chart placed');
  let error = null;
  try { buildPage({ report: fixture(), commentary: { analysis: { html: '{{chart:nope}}' } } }); } catch (err) { error = err.message; }
  assert(error && /nope/.test(error) && /attrition/.test(error), 'unknown chart error: ' + error);
});

check('names from the record are escaped', () => {
  const report = fixture();
  report.meta.armyNames = ['<b>A</b>', 'B'];
  assert(!buildPage({ report }).includes('<b>A</b>'), 'army name not escaped');
});

check('a Shapley share is each unit\'s marginal VP averaged over every arrival order', () => {
  const { vpShapley } = pageAttribution;
  // Any two of three hold the objective: each third of it.
  const two = vpShapley([1, 2, 3], present => (present.size >= 2 ? 3 : 0));
  same(Object.values(two.shares).map(v => Math.round(v * 1000) / 1000), [1, 1, 1], 'two of three');
  // Unit 1 alone holds it; 2 and 3 add nothing.
  same(vpShapley([1, 2, 3], present => (present.has(1) ? 2 : 0)).shares, { 1: 2, 2: 0, 3: 0 }, 'one decides');
  // VP scored with nobody (an owned objective) is nobody's.
  const owned = vpShapley([1, 2], () => 3);
  same([owned.none, owned.shares[1], owned.shares[2]], [3, 0, 0], 'owned');
  // Past the exact limit the orders are sampled; an additive value is exact either way.
  const ids = Array.from({ length: 14 }, (_, i) => i + 1);
  const sampled = vpShapley(ids, present => Array.from(present).reduce((sum, id) => sum + id, 0), 7);
  assert(ids.every(id => Math.abs(sampled.shares[id] - id) < 1e-9), 'sampled additive shares: ' + JSON.stringify(sampled.shares));
});

check('the scoring record adds each unit\'s shares by source, pivotal VP and VP per 100 RP', () => {
  const report = fixture();
  report.attribution = [
    { source: 'objectives', player: 0, vp: 3, shares: { 1: 2, 2: 1 }, unassigned: 0, pivotal: { 1: { lost: 3, enemyGain: 3 } } },
    { source: 'primary', player: 0, vp: 2, shares: { 1: 0.5, 2: 1.5 }, unassigned: 0 },
    { source: 'missions', player: 1, vp: 2, shares: {}, unassigned: 2 },
  ];
  const sc = summarize(report).scoring;
  const alpha = sc.rows.find(r => r.uid === 1);
  same([alpha.objectives, alpha.primary, alpha.total, alpha.pivotal, alpha.enemyGain, alpha.perRp], [2, 0.5, 2.5, 3, 3, 12.5], 'Alpha');
  same(sc.byVp.map(r => r.name), ['Alpha', 'Bravo'], 'ranked by VP');
  same(sc.unassigned[1], { objectives: 0, primary: 0, missions: 2 }, 'unassigned');
  assert(summarize(fixture()).scoring.recorded === false, 'a record without attribution says so');
  assert(buildPage({ report }).includes('id="scoring"'), 'the page shows the scoring record');
  assert(!buildPage({ report: fixture() }).includes('id="scoring"'), 'and leaves it out without one');
});

check('a batch averages each unit type\'s VP per copy fielded', () => {
  const unitRow = (type, rp, vp, pivotal, alive) => ({ type, rp, vp, pivotal, objectives: vp, primary: 0, missions: 0, alive });
  const batch = { games: [
    { units: [[unitRow('Levies', 10, 2, 3, true), unitRow('Levies', 10, 0, 0, false)], [unitRow('Tank', 40, 4, 0, true)]] },
    { units: [[unitRow('Levies', 10, 1, 0, true)], [unitRow('Tank', 40, 0, 0, false)]] },
  ] };
  const levies = typeTable(batch).find(t => t.type === 'Levies');
  same([levies.copies, levies.vpPer, levies.pivotalPer, levies.perRp, levies.survived], [3, 1, 1, 10, 2], 'Levies');
  same(typeTable(batch).find(t => t.type === 'Tank').perRp, 5, 'Tank per 100 RP');
});

// A live folder as record.cjs --live leaves it: the record at deployment, then at the
// end of Battle Round 1, each with its small board image beside the snapshots.
function liveFolder(image) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'battle-report-live-'));
  fs.mkdirSync(path.join(dir, 'live'));
  const start = fixture();
  start.snaps = start.snaps.slice(0, 1);
  start.image = image;
  delete start.result;
  fs.writeFileSync(path.join(dir, 'live', 'start.json'), JSON.stringify(start));
  const round = fixture();
  round.snaps = round.snaps.slice(0, 2);
  round.image = image;
  delete round.result;
  fs.writeFileSync(path.join(dir, 'live', 'round-1.json'), JSON.stringify(round));
  fs.writeFileSync(path.join(dir, 'commentary.json'), JSON.stringify({ title: 'Live Test', rounds: { 1: { title: 'First blood', feed: [{ phase: 'Action', text: 'Alpha shoots.' }] } } }));
  return dir;
}

check('a live page shows the armies and the deployment, and waits for the rounds', () => {
  const dir = liveFolder('data:image/jpeg;base64,AAAA');
  const page = livePage(dir, false);
  assert(page.startsWith('<title>Live Test</title>'), 'its title');
  assert(page.includes('id="live-rounds"') && page.includes('id="live-status"'), 'the rounds slot and the live bar');
  assert(page.includes("collection('rounds')"), 'the live client subscribes to the rounds');
  assert(page.includes('data:image/jpeg;base64,AAAA') && page.includes('id="deployment"'), 'the deployment board');
  assert(!/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(page), 'no skeleton of its own');
});

check('a live round is the finished report\'s round section, with its commentary, in one document', () => {
  const dir = liveFolder('data:image/jpeg;base64,AAAA');
  const { doc } = liveRound(dir, 1, false);
  same([doc.round, doc.final, doc.title, doc.vp], [1, false, 'First blood', [3, 1]], 'document fields');
  assert(doc.html.startsWith('<section class="round" id="round-1">') && doc.html.includes('Alpha shoots.'), 'round section with commentary');
  assert(doc.html.includes('data:image/jpeg;base64,AAAA'), 'the round\'s board');
  let error = null;
  try { liveRound(liveFolder('data:image/jpeg;base64,' + 'A'.repeat(300 * 1024)), 1, false); } catch (err) { error = err.message; }
  assert(error && /over 250 KiB/.test(error), 'a document over the limit is refused: ' + error);
});

check('the activity recorder sorts each APt into its action, and asks the engine who held fire', () => {
  // The page's own functions, stubbed: each records that it ran and calls what the
  // real one would (an ability firing a weapon, an Overwatch reaction's shot).
  const page = { console, G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 1, units: [] } };
  page.window = page;
  vm.createContext(page);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_activity.js'), 'utf8'), page);
  const a = { uid: 1, alive: true, col: 1, player: 0 }, b = { uid: 2, alive: true, col: 2, player: 1 }, c = { uid: 3, alive: true, col: 3, player: 0 };
  page.G.units = [a, b, c];
  Object.assign(page, {
    isStructure: () => false,
    unitHeldFireInRound: u => u === c,
    spendUnitAPt: () => 1,
    resolveCompositionRangedAttack: () => ({}),
    resolveGrantedRangedAttack: () => ({}),
    resolveMeleeAttack: (attacker, defender) => { page.payCounterattack(defender); return {}; },
    payCounterattack: () => {},
    castRite: () => ({}), channelMana: () => ({}),
    triggerOverwatchReaction: (watcher, target) => page.resolveGrantedRangedAttack(watcher, target, {}, { reaction: true }),
    useAbility: (unit, name) => (name === 'Barrage' ? page.resolveGrantedRangedAttack(unit, b, {}, {}) : {}),
    endCleanupPhase: () => {}, showVictory: () => {},
  });
  const R = {};
  page.installActivityRecorder(R);
  page.resolveCompositionRangedAttack(a, b);
  page.resolveMeleeAttack(b, a);                 // b attacks, a counterattacks
  page.useAbility(a, 'Barrage');                 // fires a weapon: a ranged action
  page.useAbility(b, 'Prayer');                  // a plain ability
  page.castRite(b, 'r');
  page.triggerOverwatchReaction(a, b);           // an Overwatch shot, not a ranged action
  page.G.battlePhase = 'MOVEMENT';
  page.spendUnitAPt(b, 1);                       // a Fall Back
  page.endCleanupPhase();
  page.showVictory();                            // the same round: idle asked once
  same(R.activity.map(e => `${e.uid}:${e.kind}`), ['1:ranged', '2:melee', '1:melee', '1:ranged', '2:ability', '2:magic', '1:overwatch', '2:movement', '3:idle'], 'activity');
});

check('a use that takes control of a unit is credited with the objective it holds and the attacks it makes', () => {
  // Whispers of Forbidden Pleasure: the seized unit's OC counts for the seizer at scoring,
  // which the record could not see (a seizure is no modifier, status or HP change), so
  // every use read as buying nothing. The engine's functions, stubbed.
  const page = { console, Math, JSON };
  page.window = page;
  vm.createContext(page);
  EFFECTS_FILES.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', f), 'utf8'), page));
  const queen = { uid: 1, name: 'Queen', alive: true, col: 1, row: 1, player: 1, statuses: [], flags: {} };
  const shield = { uid: 2, name: 'Shieldbearers', alive: true, col: 5, row: 5, player: 0, statuses: [], flags: {} };
  const foe = { uid: 3, name: 'Javidan', alive: true, col: 6, row: 5, player: 0, statuses: [], flags: {} };
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 2, units: [queen, shield, foe], players: [{ cp: 0 }, { cp: 0 }],
      objectives: [{ col: 5, row: 5, vp: 2 }], skirmishMode: 'seize_the_ground', field: [], oncePerBattle: {} },
    Stats: { health: u => ({ current: 4 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] }, expectedGroupsCasualties: () => 1.5,
    // The objective's controller is the player of the unit standing on it.
    objectiveController: o => page.G.units.filter(u => u.alive && u.col === o.col && u.row === o.row).map(u => u.player)[0],
    executeHQCommand: () => ({ ok: false }), castRite: () => ({ ok: false }),
    useAbility: (unit, name, target) => { target.flags.seizedFrom = target.player; target.player = unit.player; return { ok: true }; },
    scoreObjectives: () => {}, resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}),
    applyStatus: () => true, applyDamageOfType: () => ({}), runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  page.useAbility(queen, 'Whispers of Forbidden Pleasure', shield);
  page.resolveCompositionRangedAttack(shield, foe, [], {});   // the seized unit shoots its old side
  page.scoreObjectives();
  const use = R.uses[0];
  same(use.changes.control, [{ uid: 2, from: 0, to: 1 }], 'the change of control');
  same(use.gains.map(g => g.kind), ['controlledAttack', 'objective'], 'what it bought');
  same([use.gains[1].with, use.gains[1].without], [1, 0], 'the objective is the seizer\'s with it, its owner\'s without');
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: [queen, shield, foe], uses: R.uses }, 'b')[0];
  same([judged.verdict, judged.vp, judged.heldAttacks], ['paid off', 4, 1], 'judged');
  assert(judged.why.some(w => /took control of Shieldbearers/.test(w)), 'says so: ' + judged.why.join('; '));
  // Back with its owner, the unit decides nothing more for the seizer.
  shield.player = 0; delete shield.flags.seizedFrom;
  page.scoreObjectives();
  same(use.gains.length, 2, 'nothing after it goes home');
});

check('a round mark a use puts on its own units is judged on the attacks those units make', () => {
  // Universal Ruler marks every friendly MOUNTED unit (mark_round) and its combat effect
  // reads the mark on the attacker, so the record saw no change on any enemy and every
  // use read as buying nothing. The user's own mark is its own bookkeeping, not a lever.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const khan = { uid: 1, name: 'Genghis Khan', alive: true, col: 1, row: 1, player: 0, statuses: [], flags: {} };
  const guards = { uid: 2, name: 'Khesig Guards', alive: true, col: 2, row: 1, player: 0, statuses: [], flags: {} };
  const foe = { uid: 3, name: 'Hounds of Satan', alive: true, col: 3, row: 1, player: 1, statuses: [], flags: {} };
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 2, units: [khan, guards, foe], players: [{ cp: 3 }, { cp: 0 }],
      objectives: [], field: [], oncePerBattle: {} },
    Stats: { health: () => ({ current: 6 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] },
    // The estimate reads the mark on the attacker: +2.
    expectedGroupsCasualties: (attacker) => 1 + (page.roundMarkActive(attacker, 'universal_ruler') ? 2 : 0),
    useAbility: (unit) => {
      [khan, guards].forEach(u => page.markRound(u, 'universal_ruler'));
      page.markRound(unit, 'acted');
      return { ok: true };
    },
    executeHQCommand: () => ({ ok: false }), castRite: () => ({ ok: false }), scoreObjectives: () => {},
    resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}),
    applyStatus: () => true, applyDamageOfType: () => ({}), runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  page.useAbility(khan, 'Universal Ruler', null);
  page.resolveCompositionRangedAttack(guards, foe, [], {});     // the marked unit's attack: +2
  page.resolveCompositionRangedAttack(foe, guards, [], {});     // the enemy's attack on it: untouched
  const [ruler] = R.uses;
  same(ruler.changes.marks, [{ uid: 2, key: 'universal_ruler', until: 2, own: true }], 'the mark on its own unit, not the user\'s');
  same(ruler.gains.map(g => [g.attacker, g.target, g.with, g.without, g.gain]), [[2, 3, 3, 1, 2]], 'the marked unit\'s attack, with and without the mark');
  same(guards.roundState, { universal_ruler: 2 }, 'every read put the mark back');
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: [khan, guards, foe], uses: R.uses }, 'b');
  same([judged[0].verdict, judged[0].expected], ['paid off', 2], 'judged');
  assert(judged[0].why.some(w => /marked Khesig Guards \(universal ruler\)/.test(w)), 'says what it marked: ' + judged[0].why.join('; '));
});

check('a round mark and a weapon surge are judged on the attacks they changed; a pool a use fills is what it bought', () => {
  // Mark of Acquisition's +DMG lives in the target's round marks and flags, Liquidate
  // Assets' +1 AR/FR in its player's surge records: neither is a modifier, a status or
  // HP, so every use read as buying nothing. The engine's functions, stubbed; the round
  // marks are the engine's own (core/round_state.js).
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const valkyrie = { uid: 1, name: 'Valkyrie', alive: true, col: 1, row: 1, player: 0, statuses: [], flags: {} };
  const raiders = { uid: 2, name: 'Corporaiders', alive: true, col: 2, row: 1, player: 0, statuses: [], flags: {} };
  const foe = { uid: 3, name: 'Ramesses', alive: true, col: 3, row: 1, player: 1, statuses: [], flags: {} };
  const surged = p => (page.G.players[p].playerWeaponMods || []).some(r => r.expiresRound >= page.G.round);
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 2, units: [valkyrie, raiders, foe], players: [{ cp: 3 }, { cp: 0 }],
      objectives: [], field: [], oncePerBattle: {}, loots: [4, 0] },
    Stats: { health: () => ({ current: 6 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] },
    FACTION_RESOURCE_POOLS: { loots: {} }, getPool: (id, p) => page.G.loots[p],
    // The estimate reads the mark on its target (+1) and its attacker's side's surge (+0.5).
    expectedGroupsCasualties: (attacker, target) => 1.5
      + (page.roundMarkActive(target, 'marked_for_acquisition') && target.flags.markedForAcquisitionByPlayer === attacker.player ? 1 : 0)
      + (surged(attacker.player) ? 0.5 : 0),
    useAbility: (unit, name, target) => {
      if (name === 'Plunder') { page.G.loots[unit.player] += 1; return { ok: true }; }
      page.markRound(target, 'marked_for_acquisition');
      target.flags.markedForAcquisitionByPlayer = unit.player; target.flags.markedForAcquisitionDmgBonus = 1;
      return { ok: true };
    },
    executeHQCommand: (player) => {
      page.G.players[player].playerWeaponMods = [{ attackDice: 1, source: 'LIQUIDATE ASSETS', expiresRound: page.G.round }];
      page.G.loots[player] -= 3;
      return { ok: true };
    },
    castRite: () => ({ ok: false }), scoreObjectives: () => {}, resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}),
    applyStatus: () => true, applyDamageOfType: () => ({}), runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  page.useAbility(valkyrie, 'Mark of Acquisition', foe);
  page.resolveCompositionRangedAttack(raiders, foe, [], {});    // on the marked enemy: +1
  page.resolveCompositionRangedAttack(foe, raiders, [], {});    // the enemy's own attack: untouched
  page.executeHQCommand(0, 'Liquidate Assets', null);
  page.resolveCompositionRangedAttack(valkyrie, foe, [], {});   // both: the mark +1, the surge +0.5
  page.useAbility(raiders, 'Plunder', null);
  const [mark, surge, plunder] = R.uses;
  same(mark.changes.marks, [{ uid: 3, key: 'marked_for_acquisition', until: 2, own: false }], 'the mark');
  same(mark.gains.map(g => [g.attacker, g.with, g.without, g.gain]), [[2, 2.5, 1.5, 1], [1, 3, 2, 1]], 'each attack on the marked enemy, with and without the mark');
  same(surge.changes.surge, [{ player: 0, source: 'LIQUIDATE ASSETS', attackDice: 1 }], 'the surge');
  same(surge.gains.map(g => [g.attacker, g.with, g.without, g.gain]), [[1, 3, 2.5, 0.5]], 'the attack its side made while it held');
  same(surge.cost, { cp: 0, mana: 0, loots: 3 }, 'what the command spent');
  same(plunder.gains.map(g => [g.kind, g.pool, g.amount, g.from]), [['pool', 'loots', 1, 'use']], 'Plunder filled the pool');
  same(JSON.stringify(foe.roundState) + JSON.stringify(foe.flags) + page.G.players[0].playerWeaponMods.length,
    '{"marked_for_acquisition":2}{"markedForAcquisitionByPlayer":0,"markedForAcquisitionDmgBonus":1}1', 'every read put the change back');
  // The next round both have lapsed: an attack then is no use's.
  page.G.round = 3;
  page.resolveCompositionRangedAttack(raiders, foe, [], {});
  same([mark.gains.length, surge.gains.length], [2, 1], 'nothing after they lapse');
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: [valkyrie, raiders, foe], uses: R.uses }, 'b');
  same(judged.map(r => [r.verdict, r.expected]), [['paid off', 2], ['paid off', 0.5], ['paid off', 0]], 'judged');
  assert(judged[0].why.some(w => /marked Ramesses \(marked for acquisition\)/.test(w)), 'says what it marked: ' + judged[0].why.join('; '));
  assert(judged[1].why.some(w => /weapons \+1 AR\/FR \(LIQUIDATE ASSETS\)/.test(w)), 'says what it surged: ' + judged[1].why.join('; '));
  assert(judged[2].why.some(w => /1 loots gained/.test(w)), 'says what it gained: ' + judged[2].why.join('; '));
});

check('CP and Mana a use gains, a mission it completes and a CHARGE its Countercharge cancels are what it bought', () => {
  // Mint Privilege's CP was a negative cost, COMMAND AUTHORITY completed by a Double Time
  // went unseen, and a Countercharge changes nothing on the board as it is answered: each
  // read as buying nothing (Champion League D1-M02, D1-M22, D1-M17). The engine, stubbed.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const otto = { uid: 1, name: 'Otto', alive: true, col: 1, row: 1, player: 0, statuses: [], flags: {} };
  const guard = { uid: 2, name: 'Guard', alive: true, col: 2, row: 1, player: 0, statuses: [], flags: {} };
  const rynda = { uid: 3, name: 'Rynda Guard', alive: true, col: 4, row: 1, player: 1, statuses: [], flags: {} };
  const R = { seq: 0, resources: [] };
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'COMMAND', round: 3, units: [otto, guard, rynda], players: [{ cp: 1, vp: 0 }, { cp: 0, vp: 0 }],
      objectives: [], field: [], oncePerBattle: {} },
    Stats: { health: () => ({ current: 6 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] }, expectedGroupsCasualties: () => 0, ABILITIES_DATA: {},
    useAbility: () => { page.G.players[0].cp += 2; return { ok: true }; },          // Mint Privilege: +2 CP
    executeHQCommand: (p) => {                                                        // a Double Time that completes a mission
      page.G.players[p].cp -= 1;
      R.resources.push({ seq: ++R.seq, round: 3, kind: 'vp', player: p, delta: 2, total: 2, source: 'mission:COMMAND AUTHORITY' });
      return { ok: true };
    },
    _expandInterjection: (def) => [{ id: def.id, name: 'Guard', player: 0, apply: () => {} }],
    // The reaction is answered (its unit picked), then its CHARGE lands and the enemy's is canceled.
    offerCountercharge: (charger, col, row, done) => {
      page._expandInterjection({ id: 'command_countercharge', name: 'Countercharge' }, {}, 0)[0].apply({ unit: guard });
      done({ canceled: true });
      return { paused: false };
    },
    castRite: () => ({ ok: false }), scoreObjectives: () => {}, resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}),
    applyStatus: () => true, applyDamageOfType: () => ({}), runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  page.useAbility(otto, 'Mint Privilege', null);
  page.executeHQCommand(0, 'Double Time', guard, 1);
  page.G.battlePhase = 'MOVEMENT';
  let answered = null;
  page.offerCountercharge(rynda, 3, 1, r => { answered = r; });
  same(answered, { canceled: true }, 'the flow hears the answer');
  const [mint, dt, cc] = R.uses;
  same([mint.cost, mint.gains.map(g => [g.kind, g.pool, g.amount, g.from])], [{ cp: 0, mana: 0 }, [['pool', 'cp', 2, 'use']]], 'Mint Privilege: no cost, 2 CP gained');
  same(dt.gains.map(g => [g.kind, g.name, g.vp]), [['mission', 'COMMAND AUTHORITY', 2]], 'the mission the Double Time completed');
  same([cc.name, cc.gains.map(g => [g.kind, g.charger])], ['Countercharge', [['canceled', 3]]], 'the CHARGE the Countercharge canceled');
  // A record made before carries the CP as a negative cost.
  const old = Object.assign({}, mint, { cost: { cp: -2, mana: 0 }, gains: [] });
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: page.G.units, uses: R.uses.concat([old]) }, 'b');
  same(judged.map(r => r.verdict), ['paid off', 'paid off', 'paid off', 'paid off'], 'each paid off');
  same(judged.map(r => r.why.join('; ')), ['2 CP gained', 'completed COMMAND AUTHORITY (+2 VP)', 'canceled the CHARGE of Rynda Guard', '2 CP gained'], 'and says what it bought');
  same([judged[0].cost.cp, judged[3].cost.cp], [0, 0], 'a gain is no cost');
});

check('a rule\'s pick is a use: the move it granted, where the unit moved, or that it stayed', () => {
  // Passage by Fire's owed pick handed a MOUNTED unit a move and left no trace in the
  // record (Champion League D1-M19 R3). The engine's pick and run of MOVE actions, stubbed.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const dragoons = { uid: 1, name: 'Dragoon Brethren', alive: true, col: 1, row: 1, player: 0, statuses: [], flags: {} };
  const riders = { uid: 2, name: 'Crimson Knights', alive: true, col: 2, row: 1, player: 0, statuses: [], flags: {} };
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 3, units: [dragoons, riders], players: [{ cp: 0 }, { cp: 0 }],
      objectives: [], field: [], oncePerBattle: {}, pendingMoveOrders: null },
    Stats: { health: () => ({ current: 6 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] }, expectedGroupsCasualties: () => 0,
    // The pick's grant_move opens a run of MOVE actions; the AI plays it after the pick.
    pickOneApply: (carrier, effect, picked) => { page.beginMoveOrders(carrier, [picked], 2, 'PASSAGE BY FIRE'); return { ok: true }; },
    beginMoveOrders: (commander, units, points, reason) => {
      page.G.pendingMoveOrders = { player: commander.player, uids: units.map(u => u.uid), movementPoints: points, reason, movingUid: null };
      return units.length;
    },
    endMoveOrders: () => { page.G.pendingMoveOrders = null; return { ok: true }; },
    moveUnit: () => ({ ok: true }),
    executeHQCommand: () => ({ ok: false }), useAbility: () => ({ ok: false }), castRite: () => ({ ok: false }), scoreObjectives: () => {},
    resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}), applyStatus: () => true, applyDamageOfType: () => ({}),
    runDefinitionEffects: () => {},
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  page.pickOneApply(dragoons, {}, riders, 'Passage by Fire');
  const run = page.G.pendingMoveOrders;
  run.movingUid = riders.uid;
  page.moveUnit(riders, 4, 1, {});
  run.movingUid = null; run.uids.splice(0, 1);
  page.endMoveOrders();
  page.G.round = 4;
  page.pickOneApply(dragoons, {}, riders, 'Passage by Fire');
  page.endMoveOrders();                                    // the AI stopped: Crimson Knights stayed
  same(R.uses.map(u => [u.kind, u.name, u.by, u.target]), [['ability', 'Passage by Fire', 1, 2], ['ability', 'Passage by Fire', 1, 2]], 'each pick a use');
  same(R.uses[0].changes.orders, [{ uids: [2], points: 2, reason: 'PASSAGE BY FIRE' }], 'the move it granted');
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: page.G.units, uses: R.uses }, 'b');
  same(judged.map(r => [r.verdict, r.why.join('; ')]), [
    ['paid off', 'granted Crimson Knights (2 MP, PASSAGE BY FIRE) a move; moved Crimson Knights to (4,1); 1 move(s) with it, 1 out of reach without it'],
    ['nothing', 'granted Crimson Knights (2 MP, PASSAGE BY FIRE) a move; Crimson Knights stayed']], 'where it moved, or that it stayed');
});

check('an ability decided at a seam is named by the ability, on the unit it picked', () => {
  // Choose the Moment's options name the enemy it marks: its use was recorded under the
  // name "Staurotheke War-Shrine" (Champion League D1-M06 R2). The seam, stubbed as
  // interjections.js expands a pick_target decision.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const rotmistrz = { uid: 1, name: 'Rotmistrz', alive: true, col: 1, row: 1, player: 0, statuses: [], flags: {} };
  const shrine = { uid: 2, name: 'Staurotheke War-Shrine', alive: true, col: 3, row: 1, player: 1, statuses: [], flags: {} };
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'MOVEMENT', round: 2, units: [rotmistrz, shrine], players: [{ cp: 0 }, { cp: 0 }], objectives: [], field: [], oncePerBattle: {} },
    Stats: { health: () => ({ current: 6 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] }, expectedGroupsCasualties: () => 0,
    ABILITIES_DATA: { choose_the_moment: { name: 'Choose the Moment' } },
    _expandInterjection: (def, ctx, player) => def.options(ctx).map(o => Object.assign({}, def, o, { player })),
    executeHQCommand: () => ({ ok: false }), useAbility: () => ({ ok: false }), castRite: () => ({ ok: false }), scoreObjectives: () => {},
    resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}), applyStatus: () => true, applyDamageOfType: () => ({}),
    runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  const def = { id: 'choose_the_moment', name: 'CHOOSE THE MOMENT', seam: 'movementPhaseStart',
    options: () => [{ id: 'unit:2', name: shrine.name, targetUid: shrine.uid, apply: c => { c.target = shrine; } }] };
  page._expandInterjection(def, { unit: rotmistrz }, 0)[0].apply({ unit: rotmistrz });
  same(R.uses.map(u => [u.kind, u.name, u.by, u.target]), [['ability', 'Choose the Moment', 1, 2]], 'by the ability, on the enemy it named');
});

check('a named Omen Die is what it bought when a response only it paid for is spent', () => {
  // Name the Omen turns a die of the face-dice pool to another face: no modifier, status
  // or HP, so every use read as buying nothing. The pool and its spend, stubbed.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const dice = [[1, 1, 4], []];
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'COMMAND', round: 2, units: [], players: [{ cp: 3 }, { cp: 0 }], objectives: [], field: [], oncePerBattle: {} },
    Stats: { health: () => ({ current: 1 }) }, getMana: () => 0, isStructure: () => false, isSpotted: () => true,
    STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] }, expectedGroupsCasualties: () => 0,
    faceDiceOf: p => dice[p].slice(),
    spendFaceDie: (p, face) => { const i = dice[p].indexOf(face); if (i < 0) return false; dice[p].splice(i, 1); return true; },
    executeHQCommand: (p, name) => {
      if (name === 'Name the Omen') dice[p][1] = 3;       // a 1 the pool held twice becomes a 3
      return { ok: true };
    },
    useAbility: () => ({ ok: false }), castRite: () => ({ ok: false }), scoreObjectives: () => {},
    resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}),
    applyStatus: () => true, applyDamageOfType: () => ({}), runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  page.executeHQCommand(0, 'Name the Omen', null);
  const [use] = R.uses;
  same(use.changes.faces, [{ player: 0, from: 1, to: 3 }], 'the die it turned');
  page.spendFaceDie(0, 1);                                // a face it did not name
  page.spendFaceDie(0, 3);                                // the only 3: the named die
  page.spendFaceDie(0, 3);                                // nothing left to spend
  same(use.gains.map(g => [g.kind, g.face]), [['averted', 3]], 'the response only it paid for, once');
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: [], uses: R.uses }, 'b');
  same(judged[0].verdict, 'paid off', 'judged');
  assert(judged[0].why.some(w => /turned a die 1 to 3, spent on 1 response/.test(w)), 'says so: ' + judged[0].why.join('; '));
});

check('an army-wide Command-Phase pick is judged on the attacks its unit makes and takes, and the enemies it alone SPOTTED', () => {
  // Hymns of the Anvil and Mantle of Mercy write one entry in G.commandPhasePicks, read
  // through the command_selected predicate: no modifier, status or HP, so every pick read
  // as buying nothing. The pick's seam and the estimate, stubbed.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  ['../engine/modules/core/round_state.js', 'battle_report/page_effects_levers.js'].concat(EFFECTS_FILES.map(f => 'battle_report/' + f))
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), page));
  const mk = (uid, name, player, col) => ({ uid, name, alive: true, col, row: 1, player, statuses: [], flags: {} });
  const smith = mk(1, 'Forge Smiths', 0, 1), shield = mk(2, 'Ignis Guard', 0, 2), scout = mk(3, 'Dioptrai', 0, 3);
  const foe = mk(4, 'Javidan', 1, 4), far = mk(5, 'Far Riders', 1, 9);
  const CHOICES = [{ id: 'pyracmon', name: 'Pyracmon Hymn' }, { id: 'sevenfold', name: 'Sevenfold Shield Hymn' }, { id: 'dioptra', name: 'Dioptra Hymn' }];
  const picked = (u, choice) => page.G.commandPhasePicks.some(p => p.uid === u.uid && p.choice === choice && p.round === page.G.round);
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'COMMAND', round: 2, units: [smith, shield, scout, foe, far], players: [{ cp: 3 }, { cp: 0 }],
      objectives: [], field: [], oncePerBattle: {}, commandPhasePicks: [{ player: 0, select: 'hymns', round: 1, uid: 1, choice: 'pyracmon' }] },
    Stats: { health: () => ({ current: 6 }) }, getMana: () => 0, isStructure: () => false, STATUS_HIDDEN: 'HIDDEN', Weapons: { groups: () => [] },
    unitByUid: uid => page.G.units.find(u => u.uid === uid), armyPickDef: () => ({ spec: { choices: CHOICES } }),
    getEffectivePER: u => 6 + (picked(u, 'dioptra') ? 2 : 0),
    // The far enemy is seen only through the Dioptrai's raised PER.
    isSpotted: (p, col, row, t) => t !== far || picked(scout, 'dioptra'),
    // Pyracmon: +0.5 on its unit's attacks; Sevenfold Shield: -0.25 on attacks made on its unit.
    expectedGroupsCasualties: (attacker, target) => 1 + (picked(attacker, 'pyracmon') ? 0.5 : 0) - (picked(target, 'sevenfold') ? 0.25 : 0),
    _expandInterjection: (def, ctx, player) => def.options(ctx).map(o => Object.assign({}, o, { player })),
    executeHQCommand: () => ({ ok: false }), useAbility: () => ({ ok: false }), castRite: () => ({ ok: false }), scoreObjectives: () => {},
    resolveCompositionRangedAttack: () => ({}), _resolveMeleeStrike: () => ({}),
    applyStatus: () => true, applyDamageOfType: () => ({}), runDefinitionEffects: () => {}, moveUnit: () => ({ ok: true }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installEffectsRecorder(R); } finally { console.warn = warn; }
  // The choice seam, as phases/command_phase_army_picks.js registers it: its apply records the pick.
  const choose = (unit, choiceId) => {
    const def = { id: 'command_phase_army_choice', options: () => CHOICES.map(c => ({ id: c.id, name: c.name,
      apply: () => { page.G.commandPhasePicks = page.G.commandPhasePicks.filter(p => p.round === page.G.round)
        .concat([{ player: 0, select: 'hymns', round: page.G.round, uid: unit.uid, choice: c.id }]); } })) };
    page._expandInterjection(def, { player: 0, uid: unit.uid }, 0).find(c => c.id === choiceId).apply({ player: 0, uid: unit.uid });
  };
  choose(smith, 'pyracmon'); choose(shield, 'sevenfold'); choose(scout, 'dioptra');
  const picks = page.G.commandPhasePicks;
  page.G.battlePhase = 'ACTION';
  page.resolveCompositionRangedAttack(smith, foe, [], {});      // Pyracmon's unit attacks: +0.5
  page.resolveCompositionRangedAttack(foe, shield, [], {});     // on Sevenfold Shield's unit: 0.25 kept off
  page.resolveCompositionRangedAttack(smith, far, [], {});      // +0.5, on an enemy only the Dioptra Hymn SPOTTED
  page.resolveCompositionRangedAttack(foe, scout, [], {});      // the Dioptrai shot at: its PER changes nothing
  const [pyr, seven, diop] = R.uses;
  same(pyr.changes.picks, [{ uid: 1, select: 'hymns', choice: 'pyracmon', name: 'Pyracmon Hymn' }], 'the pick, not last round\'s');
  same(pyr.gains.map(g => [g.attacker, g.target, g.with, g.without, g.gain]), [[1, 4, 1.5, 1, 0.5], [1, 5, 1.5, 1, 0.5]], 'its unit\'s attacks');
  same(seven.gains.map(g => [g.attacker, g.target, g.with, g.without, g.gain]), [[4, 2, 0.75, 1, 0.25]], 'the attack on its unit');
  same(diop.changes.spotted, [5], 'SPOTTED as it was made');
  same(diop.gains.map(g => [g.kind, g.attacker, g.target, g.gain]), [['enabled', 1, 5, undefined], ['attack', 4, 3, 0]], 'the attack only it made possible, and the one on its unit');
  assert(page.G.commandPhasePicks === picks && picks.length === 3, 'every read put the picks back');
  page.G.round = 3;                                              // the round is over: the picks have lapsed
  page.resolveCompositionRangedAttack(smith, foe, [], {});
  same(pyr.gains.length, 2, 'nothing after it lapses');
  const judged = effectsRecord({ meta: { armies: [], map: 'M', armyNames: ['A', 'B'] }, units: page.G.units, uses: R.uses }, 'b');
  same(judged.map(r => [r.verdict, r.expected, r.enabled]), [['paid off', 1, 0], ['paid off', 0.25, 0], ['paid off', 0, 1]], 'judged');
  assert(judged[0].why.some(w => /picked Forge Smiths: Pyracmon Hymn/.test(w)), 'says what it picked: ' + judged[0].why.join('; '));
});

check('the activity record scores inaction and counts each action', () => {
  const report = fixture();
  report.activity = [
    { round: 1, uid: 1, kind: 'idle' }, { round: 2, uid: 1, kind: 'overwatch' }, { round: 2, uid: 1, kind: 'idle' },
    { round: 1, uid: 2, kind: 'ranged' }, { round: 2, uid: 2, kind: 'movement' }, { round: 2, uid: 2, kind: 'melee' },
  ];
  const act = summarize(report).activity;
  const alpha = act.rows.find(r => r.uid === 1), bravo = act.rows.find(r => r.uid === 2);
  same([alpha.idle, alpha.overwatch, alpha.inaction, alpha.actions, alpha.idleRounds], [2, 1, 1.75, 0, [1, 2]], 'Alpha');
  same([bravo.inaction, bravo.ranged, bravo.melee, bravo.movement, bravo.actions], [0, 1, 1, 1, 3], 'Bravo');
  same(act.byInaction[0].name, 'Alpha', 'worst first');
  same(act.idleByRound, { 1: [1], 2: [1] }, 'idle by round');
  assert(buildPage({ report }).includes('id="activity"'), 'the page shows the activity record');
  assert(!buildPage({ report: fixture() }).includes('id="activity"'), 'and leaves it out without one');
});

check('a batch averages each unit type\'s inaction and actions per copy', () => {
  const unitRow = (type, inaction, ranged) => ({ type, rp: 20, inaction, idle: inaction, overwatch: 0, movement: 0, ranged, melee: 0, ability: 0, magic: 0 });
  const t = activityTypeTable({ games: [{ activity: [[unitRow('Gun', 2, 1), unitRow('Gun', 0, 3)], []] }, { activity: [[unitRow('Gun', 1, 2)], []] }] })[0];
  same([t.copies, t.inactionPer, t.rangedPer], [3, 1, 2], 'Gun');
});

check('an idle round after a move counts as moved, and keeps the AI\'s best action', () => {
  const report = fixture();
  report.activity = [
    { round: 1, uid: 1, kind: 'idle', why: { action: 'ranged on Xray', score: 0.2 } }, { round: 2, uid: 1, kind: 'idle', why: { action: null } },
  ];
  const alpha = summarize(report).activity.rows.find(r => r.uid === 1);
  same([alpha.idle, alpha.idleMoved], [2, 1], 'Alpha walked in round 1 only');
  same(alpha.idleWhy, [{ round: 1, action: 'ranged on Xray', score: 0.2 }, { round: 2, action: null }], 'why');
});

check('the Fall Back recorder keeps the Movement Phase decision, not the AI\'s questions on boards changed for them', () => {
  // The charge planning asks the target's own weighing with the charger stood beside it
  // (_aiChargeTargetLeaves), an effect's value asks it in the Command Phase: recorded, a
  // probe overwrote the real decision, with engagers that were never adjacent (Champion
  // League D1, every report). The engine's functions, stubbed.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_fallback.js'), 'utf8'), page);
  const mk = (uid, name, player, col) => ({ uid, name, player, col, row: 1, alive: true });
  const guard = mk(1, 'Guard', 0, 1), foe = mk(2, 'Foe', 1, 2), charger = mk(3, 'Charger', 1, 6);
  const adjacent = (a, b) => Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1;
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'COMMAND', round: 1, units: [guard, foe, charger], objectives: [] },
    footprintMembers: u => [u], _aiCurrentHP: () => 5, _aiMaxHP: () => 5, unitOnBoard: u => u.col >= 0, isStructure: () => false,
    Weapons: { groups: () => [] }, unitByUid: uid => page.G.units.find(u => u.uid === uid),
    getAdjacentEnemyUnits: u => page.G.units.filter(e => e.player !== u.player && adjacent(e, u)),
    aiExpectedMeleeDamage: () => 1, aiDeathVp: () => ({ primary: 0, cards: [] }), aiScoreDestinationBreakdown: () => ({ total: 1 }),
    _aiEvalFallBack: () => ({ shouldFallBack: false, parts: { stay: 2, fallBack: 1, bestDest: { col: 0, row: 1 } } }),
    rulesReadingAside: fn => fn(),
    withFootprintAt: (unit, col, row, fn) => {
      const at = unit.col;
      unit.col = col;
      try { return page.rulesReadingAside(fn); } finally { unit.col = at; }
    },
    // The decision asks its own engaged unit; the enemy's charge planning asks it with the
    // charger stood beside it, under a scratch reading.
    aiDecideMovement: player => (player === 0 ? page._aiEvalFallBack(guard)
      : page.withFootprintAt(charger, 0, 1, () => page.rulesReadingAside(() => page._aiEvalFallBack(guard)))),
    rollFallBackTest: () => ({}), fallBack: () => ({ ok: true }),
  });
  const R = {};
  page.installFallBackRecorder(R);
  page._aiEvalFallBack(guard);                  // Round 1, Command Phase: an effect asks
  page.G.battlePhase = 'MOVEMENT';
  page.aiDecideMovement(0);                     // the decision: Guard stays
  page.aiDecideMovement(1);                     // the Charger's planning asks it again
  page.G.round = 2; page.G.battlePhase = 'COMMAND';
  page._aiEvalFallBack(guard);                  // Round 2: asked only by an effect
  same(R.fallBacks.map(e => [e.round, e.phase, e.decision, e.board.engagers.map(x => x.name)]), [[1, 'MOVEMENT', false, ['Foe']]],
    'the decision, its engagers as they stood');
});

check('a Fall Back is judged on danger, the ground it held and what leaving opened', () => {
  const report = fixture();
  report.result = Object.assign({}, report.result, { round: 9 });   // no round here can end the battle
  const board = (o) => Object.assign({ hp: 5, maxHp: 5, threat: 1, engagers: [{ uid: 3, name: 'Xray', hp: 5, dealt: 1, taken: 1 }],
    shotAt: { stay: 0, dest: 0 }, killVp: { primary: 0, cards: [] }, objectives: [], opensFire: 0,
    terms: { stay: { screen: 0 }, dest: { screen: 0 } } }, o);
  const entry = (uid, round, fellBack, b) => ({ round, uid, name: uid === 1 ? 'Alpha' : 'Bravo', player: 0, fellBack, decision: fellBack,
    plannedDest: { col: 0, row: 3 }, board: board(b) });
  report.fallBacks = [
    entry(2, 1, true, { objectives: [{ col: 1, row: 2, vp: 3, here: true, now: 0, ifLeaves: null, atDest: null }] }),
    entry(1, 1, true, { threat: 6 }),
    entry(1, 2, true, {}),
    entry(2, 2, false, {}),
    entry(1, 1, true, { engagers: [{ uid: 4, name: 'Yankee', hp: 5, dealt: 1, taken: 1 }], opensFire: 1 }),
    { round: 2, uid: 1, name: 'Alpha', player: 0, fellBack: true, board: null },
  ];
  const rows = fallBackRecord(report, 'test');
  same(rows.map(r => r.verdict), ['costly', 'sound', 'doubtful', 'should have left', 'sound'], 'verdicts; a granted Fall Back has no board');
  report.fallBacks = [entry(1, 2, true, { engagers: [{ uid: 3, name: 'Xray', hp: 2, dealt: 0.1, taken: 2 }], threat: 0.1 }),
    entry(2, 2, false, { engagers: [{ uid: 4, name: 'Yankee', hp: 5, dealt: 5, taken: 1 }], threat: 5 })];
  const fight = fallBackRecord(report, 'test');
  same([fight[0].verdict, fight[0].q.canKill], ['left a winning fight', true], 'it walked away from a fight it would have won');
  same([fight[1].verdict, fight[1].outcome.killedBy], ['caught by others', 'Xray'], 'Bravo was destroyed by an enemy it was not fighting');
  const trapped = entry(2, 2, false, {});
  trapped.parts = { taken: 4, followed: 3 };
  report.fallBacks = [trapped];
  same(fallBackRecord(report, 'test')[0].verdict, 'could not escape', 'an engager that would follow it left it nowhere to go');
  const cornered = entry(2, 2, false, {});
  cornered.plannedDest = null;
  report.fallBacks = [cornered];
  same(fallBackRecord(report, 'test')[0].verdict, 'could not escape', 'with no square to fall back to it could not leave');
  same(rows[0].q.stake, 3, 'left 3 objective VP');
  same(rows[3].outcome.destroyed, true, 'Bravo stayed and died');
  same(rows[4].outcome.shotsAtEngagers, 1, 'the shot it opened was taken');
});

check('a use is judged on what its change bought, and the page shows it', () => {
  const report = fixture();
  const use = (id, name, player, changes, gains, cost) => ({ id, round: 1, phase: 'COMMAND', kind: 'command', name, player, by: null,
    target: 1, cost: cost || { cp: 1, mana: 0 }, changes, gains });
  report.uses = [
    // +2 PER that SPOTTED nothing and touched no attack: bought nothing.
    use(1, 'Scouting Order', 0, { mods: [{ uid: 1, stats: ['PER +2'] }], spotted: [] }, []),
    // A shot only it made possible, and an attack its weapon tag improved, whose BURNED ticked later.
    use(2, 'Scouting Order', 0, { mods: [{ uid: 2, stats: ['PER +2'] }], spotted: [3] }, [
      { kind: 'enabled', round: 1, attacker: 1, target: 3, expected: 2.5, actual: 3 },
      { kind: 'attack', round: 1, attacker: 2, target: 3, with: 3, without: 2, gain: 1, tags: ['ABLAZE'] },
      { kind: 'dot', round: 1, target: 3, hp: 2, friendly: false }]),
    // A MOVE it gave that reached nowhere new, and its own unit's HP it cost.
    use(3, 'Double Time', 0, { mods: [{ uid: 1, stats: ['MOVE +2'] }], hp: [{ uid: 1, delta: -2 }] }, [
      { kind: 'move', round: 1, uid: 1, to: [2, 2], needed: false }], { cp: 2, mana: 0 }),
    // An objective it decided for the other side's opponent: Army B's use, Army B's VP.
    use(4, 'Secure Objective', 1, { mods: [{ uid: 3, stats: ['OC +1'] }] }, [
      { kind: 'objective', round: 1, col: 1, row: 1, vp: 3, with: 1, without: 0 }], { cp: 3, mana: 0 }),
    // A unit it placed that made no attack but scored and drew the enemy's fire (Fireball).
    use(5, 'Troop Requisition', 0, { placed: [2] }, [], { cp: 3, mana: 0 }),
    // A unit sent into TRANSITIONAL STATE, credited with the round it came back in; one
    // that never came back bought nothing.
    use(6, 'Gatescroll', 0, { transit: [1] }, [
      { kind: 'emerged', round: 2, uid: 1, to: [3, 3] },
      { kind: 'emergedAttack', round: 2, attacker: 1, target: 3, expected: 2, actual: 2 }], { cp: 1, mana: 0 }),
    use(7, 'Gatescroll', 0, { transit: [1] }, [], { cp: 1, mana: 0 }),
  ];
  // The scoring record: Bravo's share of a Round 1 objective, Alpha's of a Round 2 one.
  report.attribution = [
    { source: 'objective', player: 0, what: 'obj', vp: 2, shares: { 1: 0.5, 2: 1.5 }, round: 1 },
    { source: 'objective', player: 0, what: 'obj', vp: 2, shares: { 1: 2 }, round: 2 },
  ];
  const rows = effectsRecord(report, 'test');
  same(rows.map(r => r.verdict), ['nothing', 'paid off', 'nothing', 'paid off', 'paid off', 'paid off', 'nothing'], 'verdicts');
  same([rows[4].placedAttacks, rows[4].placedVp, rows[4].drawnAttacks, rows[4].drawnHp], [0, 1.5, 1, 5], 'the placed unit scored 1.5 VP and drew 1 attack, 5 HP');
  same([rows[5].emerged, rows[5].emergedAttacks, rows[5].emergedVp], [['Alpha at (3,3) in R2'], 1, 2], 'the round it emerged: 1 attack, its 2 VP of that round only');
  same([rows[1].enabled, rows[1].enabledExpected, rows[1].damage, rows[1].spotted], [1, 2.5, 3, ['Xray']], 'the second Scouting Order');
  same([rows[2].movesNeeded, rows[2].selfCost, rows[2].damage], [0, 2, -2], 'Double Time cost 2 HP and reached nowhere new');
  same(rows[3].vp, 6, 'taking an objective from the enemy is its 3 VP and the 3 VP denied');
  const table = effectsTable(rows);
  same(table.map(g => [g.name, g.uses, g.nothing, g.cp, g.unitVp]), [['Scouting Order', 2, 1, 2, 0], ['Gatescroll', 2, 1, 2, 2],
    ['Double Time', 1, 1, 2, 0], ['Troop Requisition', 1, 0, 3, 1.5], ['Secure Objective', 1, 0, 3, 0]], 'by name, with the VP of the units it placed or brought back');
  const html = buildPage({ report });
  assert(html.includes('id="effects"') && html.includes('href="#effects"'), 'the page shows the record');
  assert(!buildPage({ report: fixture() }).includes('id="effects"'), 'and leaves it out without one');
});

check('a passive rule is summed by what it changed in attacks and at each Movement Phase, and the page shows it', () => {
  const report = fixture();
  const attack = (ability, name, owner, ownerPlayer, attacker, gain) => ({ round: 1, phase: 'ACTION', ability, name, owner, ownerPlayer,
    attacker, target: attacker === 1 ? 3 : 1, domain: 'ranged', with: 2, without: 2 + gain, gain });
  report.passives = {
    attacks: [
      // An aura on its own side's attacks, and a defence on the enemy's: Army B's both.
      attack('weight_of_the_world', 'Weight of the World', 3, 1, 1, 0.5),
      attack('weight_of_the_world', 'Weight of the World', 3, 1, 2, 0.25),
      attack('let_them_come', 'Let Them Come', 4, 1, 4, 0.75),
    ],
    movement: [
      { round: 1, kind: 'stilled', uid: 1, player: 0, by: [{ uid: 3, ability: 'vessel_of_agares', name: 'Vessel of Agares' }], charge: true, fallBack: false },
      { round: 2, kind: 'stilled', uid: 2, player: 0, by: [{ uid: 3, ability: 'vessel_of_agares', name: 'Vessel of Agares' }], charge: false, fallBack: true },
      { round: 1, kind: 'move', uid: 4, player: 1, source: 'Effluvium', move: 1, moveWithout: 3 },
      { round: 1, kind: 'reach', uid: 1, player: 0, source: 'Effluvium', reach: 10, reachWithout: 14 },
    ],
  };
  const p = passivesRecord(report);
  same(p.attacks.map(g => [g.name, g.attacks, g.added, g.prevented, g.owners]),
    [['Weight of the World', 2, 0, 0.75, ['Xray']], ['Let Them Come', 1, 0.75, 0, ['Yankee']]], 'kept off its side, and added to its side');
  same(p.stilled.map(g => [g.name, g.army, g.unitRounds, g.charges, g.fallBacks]), [['Vessel of Agares', 'Army B', 2, 1, 1]], 'held still, under its owner');
  same([p.move[0].army, p.move[0].change, p.reach[0].army, p.reach[0].squares], ['Army B', -2, 'Army B', 4], 'MOVE on its own side, reach under its owner');
  assert(p.rounds[1].some(t => t.includes('a CHARGE denied')) && p.rounds[2].some(t => t.includes('a FALL BACK denied')), 'the digest lines by round');
  const html = buildPage({ report });
  assert(html.includes('id="passives"') && html.includes('href="#passives"') && html.includes('Vessel of Agares'), 'the page shows the record');
  assert(!buildPage({ report: fixture() }).includes('id="passives"'), 'and leaves it out without one');
  // The command line adds up a folder's battles by army and rule (passives.cjs had none:
  // `node passives.cjs <name>` printed nothing).
  const t = passivesTable([p, p]);
  same(t.attacks.map(g => [g.army, g.name, g.attacks, g.prevented]), [['Army B', 'Weight of the World', 4, 1.5], ['Army B', 'Let Them Come', 2, 0]], 'two battles summed');
  same([t.stilled[0].unitRounds, t.move[0].change, t.reach[0].squares], [4, -4, 8], 'and the Movement Phase rules');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'passives-'));
  try {
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report));
    const run = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'battle_report', 'passives.cjs'), dir], { encoding: 'utf8' });
    assert(run.status === 0 && /Weight of the World: 2 attacks/.test(run.stdout), 'the command prints the table: ' + run.stdout + run.stderr);
    same(JSON.parse(fs.readFileSync(path.join(dir, 'passives.json'), 'utf8')).map(b => b.battle), ['report.json'], 'and writes passives.json');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('the passive recorder reads every rule a unit carries, what an event fired, and each EVASION roll', () => {
  // Profane Zeal (a faction identity's weapon tag), Slave To Cupidity's rerolls, Stalking
  // Predation's CONCEALMENT, Fading Step's step and a SIDHE unit's EVASION never reached
  // the record (Champion League D1-M07..M12): it read only a unit's auras and combat
  // effects. The engine, stubbed: the identity's standing record raises the estimate.
  const page = { console, Math, JSON, Object };
  page.window = page;
  vm.createContext(page);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_passives.js'), 'utf8'), page);
  const zeal = { sourceId: 'Profane Zeal', stat: 'WEAPON_TAG' };
  const cultists = { uid: 1, name: 'Cultist Troopers', alive: true, col: 1, row: 1, player: 0, abilities: [], _modifiers: [zeal, { sourceId: 'Double Time', expiresAt: { round: 1 } }] };
  const wardens = { uid: 2, name: 'Sidhe Wardens', alive: true, col: 3, row: 1, player: 1, abilities: [], _modifiers: [] };
  const identity = { id: 'identity_infernal_congregations', name: 'Profane Zeal', effects: [{ op: 'conditional_weapon_tag', source: 'Profane Zeal' }] };
  Object.assign(page, {
    G: { phase: 'BATTLE', battlePhase: 'ACTION', round: 1, units: [cultists, wardens] },
    ABILITIES_DATA: {}, isStructure: () => false, footprintMembers: u => [u], Models: { all: () => [] }, Modifiers: { recalculate: () => {} },
    unitCarriedDefinitions: u => (u === cultists ? [identity, { id: 'double_time', name: 'Double Time', effects: [{ op: 'mod_stat' }] }] : []),
    abilityIsDeclarativeActivated: () => false, _declarativeSourceId: def => def.id, _abilityIdentityMatches: (a, id) => a.abilityId === id,
    reportAttackGroups: () => [], chebyshev: () => 2, Weapons: { range: () => 0 },
    reportAttackEstimate: a => 1 + ((a._modifiers || []).includes(zeal) ? 0.5 : 0),
    resolveCompositionRangedAttack: () => ({}),
    runOp: () => ({ ok: true }),
    applyEvasionToHits: () => ({ threshold: 5, attempted: 3, evaded: 2 }),
  });
  const R = {};
  const warn = console.warn; console.warn = () => {};
  try { page.installPassivesRecorder(R); } finally { console.warn = warn; }
  page.resolveCompositionRangedAttack(cultists, wardens, []);
  page.runOp({ op: 'grant_move', reason: 'FADING STEP' }, { mode: 'event', event: 'after_attacked', ability: { id: 'fading_step', name: 'Fading Step' }, unit: wardens, targets: [wardens] });
  page.runOp({ op: 'mod_stat' }, { mode: 'continuous', unit: wardens });       // a standing record being written: no firing
  page.applyEvasionToHits(wardens, [], {});
  same(R.passives.attacks.map(a => [a.name, a.owner, a.with, a.without, a.gain]), [['Profane Zeal', 1, 1.5, 1, 0.5]], 'the identity, with its record off; a timed record is a use\'s');
  same(cultists._modifiers.length, 2, 'every read put the records back');
  const report = fixture();
  report.units.push(unit(1, 'Cultist Troopers', 0, 10), unit(2, 'Sidhe Wardens', 1, 10));
  report.meta.armies = [[unit(1, 'Cultist Troopers', 0, 10)], [unit(2, 'Sidhe Wardens', 1, 10)]];
  report.units = report.meta.armies.flat();
  report.passives = R.passives;
  const p = passivesRecord(report);
  same(p.fired.map(g => [g.name, g.army, g.times, g.ops, g.on]), [['Fading Step', 'Army B', 1, ['grant_move'], ['Sidhe Wardens']]], 'what the event fired');
  same(p.evasion.map(g => [g.name, g.attempted, g.evaded]), [['Sidhe Wardens', 3, 2]], 'and the hits EVASION turned away');
  assert(p.rounds[1].includes('Fading Step (Sidhe Wardens): fired 1 time (grant_move)') && p.rounds[1].includes('EVASION (Sidhe Wardens, 5+): 2 of 3 hits turned away'),
    'the digest lines: ' + JSON.stringify(p.rounds[1]));
});

check('in a round that can end the battle a Fall Back is judged by the VP it gave up, kept and took', () => {
  // The Hellkin left the battle's last round "sound" on danger alone (Champion League
  // D1-M01 R5): when the battle ends that round, surviving it is worth nothing.
  const report = fixture();
  const board = o => Object.assign({ hp: 10, maxHp: 10, threat: 6, engagers: [{ uid: 3, name: 'Xray', hp: 5, dealt: 6, taken: 1 }],
    shotAt: { stay: 0, dest: 0 }, killVp: { primary: 0, cards: [] }, objectives: [], opensFire: 2,
    terms: { stay: { screen: 0 }, dest: { screen: 0 } } }, o);
  const entry = (round, b, parts) => ({ round, uid: 1, name: 'Alpha', player: 0, fellBack: true, decision: true,
    plannedDest: { col: 0, row: 3 }, dest: { col: 0, row: 3 }, parts: parts || {}, board: board(b) });
  const held = { objectives: [{ col: 1, row: 1, vp: 3, here: true, now: 0, ifLeaves: 1, atDest: 1 }] };
  report.fallBacks = [
    entry(1, held),                                                                   // Round 1: heavy danger, shots opened
    entry(2, held),                                                                   // the battle's last round: 3 VP given up
    entry(2, { killVp: { primary: 4, cards: [] } }, { stayDeathChance: 0.5 }),       // its death: 2 VP kept from the enemy
    entry(2, {}),                                                                     // no VP either way
  ];
  same(fallBackRecord(report, 'test').map(r => r.verdict), ['costly', 'costly', 'sound', 'doubtful'], 'the last round by its VP');
  // A round a player begins within a round's VP of the target can end it too.
  report.meta.vpTarget = 30; report.meta.roundVpCap = 10;
  report.snaps[1].players[1].vp = 21;
  report.fallBacks = [entry(1, { opensFire: 2 }), entry(2, { opensFire: 2 })].map(e => Object.assign(e, { round: e.round }));
  report.result = Object.assign({}, report.result, { round: 5 });
  const rows = fallBackRecord(report, 'test');
  same(rows.map(r => r.verdict), ['sound', 'doubtful'], 'Round 2 begins with Player B at 21 of 30');
  assert(rows[1].why.some(w => /Player B began the round within 10 VP of the 30 VP target/.test(w)), 'and says so: ' + rows[1].why.join('; '));
  same(decidingRound(report, 1), null, 'Round 1 could not end it');
});

check('the transport, terrain and formation recorders note each drop-off, changed square and formation, and change nothing', () => {
  const page = { console, G: { phase: 'BATTLE', battlePhase: 'MOVEMENT', round: 2, units: [], objectives: [{ col: 5, row: 5 }] } };
  page.window = page;
  vm.createContext(page);
  ['page_estimate.js', 'page_transport.js', 'page_terrain.js', 'page_formations.js'].forEach(f =>
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', f), 'utf8'), page));
  const truck = { uid: 1, alive: true, col: 2, row: 2, player: 0, embarked: [2] };
  const cargo = { uid: 2, alive: true, col: -1, row: -1, player: 0 };
  const foe = { uid: 3, alive: true, col: 6, row: 6, player: 1 };
  const banner = { uid: 4, alive: true, col: 4, row: 4, player: 0 };
  page.G.units = [truck, cargo, foe, banner];
  let terrain = 'open';
  const hidden = [];
  const calls = [];
  Object.assign(page, {
    chebyshev: (a, b, c, d) => Math.max(Math.abs(a - c), Math.abs(b - d)),
    unitByUid: uid => page.G.units.find(u => u.uid === uid),
    isStructure: () => false, unitAt: () => null,
    aiWithMoveEvalCache: fn => fn(),
    aiTransportHasCargo: t => !!(t.embarked && t.embarked.length),
    _aiTransportCargoUnits: t => t.embarked.map(page.unitByUid),
    _aiTransportBestCargoDestination: () => ({ col: 5, row: 4, turnsAway: 1 }),
    beginMovementPhaseEngine: () => calls.push('begin'), endMovementPhase: () => calls.push('end'),
    doDisembark: (t, orders) => { t.embarked = []; Object.assign(cargo, { col: orders[0].col, row: orders[0].row }); return { ok: true }; },
    doEmbark: () => ({ ok: true }),
    terrainAt: () => terrain, setSquareTerrain: (sq, to) => { terrain = to; },
    useAbility: (unit, name) => (name === 'Open the Sluice' ? page.setSquareTerrain({ col: 3, row: 3 }, 'water') : null),
    castRite: () => null,
    Formations: {
      evaluate: p => (p === 0 ? { faction: 'jade', formations: [{ id: 'azure_dragon', name: 'Azure Dragon', units: [4] }], surgingAttribute: null } : { faction: null }),
      forUnit: u => (u.uid === 4 ? { id: 'azure_dragon', player: 0, patternIndex: 0, leftCol: 4, frontRow: 4 } : null),
      instanceKey: f => [f.id, f.patternIndex, f.leftCol, f.frontRow].join('|'),
      withoutFormation: (player, key, fn) => { hidden.push(key); try { return fn(); } finally { hidden.pop(); } },
    },
    // The estimate reads the board: 2 HP with the formation standing, 1.5 with it taken off.
    expectedGroupsCasualties: () => (hidden.length ? 1.5 : 2),
    _aiGroupsAgainst: () => [], Weapons: { groups: () => [] },
    resolveCompositionRangedAttack: () => ({}), resolveCompositionBlastAttack: () => ({}), _resolveMeleeStrike: () => ({}),
  });
  const R = {};
  ['installTransportRecorder', 'installTerrainRecorder', 'installFormationsRecorder'].forEach(f => page[f](R));
  page.beginMovementPhaseEngine();
  page.doDisembark(truck, [{ uid: 2, col: 3, row: 2 }]);
  page.endMovementPhase();
  page.G.battlePhase = 'ACTION';
  page.useAbility(banner, 'Open the Sluice');
  page.resolveCompositionRangedAttack(banner, foe, []);
  page.resolveCompositionRangedAttack(foe, cargo, []);    // no one in a formation: not recorded
  same(calls, ['begin', 'end'], 'the wrapped phase functions still run');
  same(R.transport.rides.map(r => [r.at, r.uid, r.cargo[0].wants]), [['start', 1, { col: 5, row: 4, turnsAway: 1 }]], 'a loaded transport at the phase start');
  same(R.transport.drops.map(d => [d.uid, d.to, d.wantDist, d.objDist]), [[2, { col: 3, row: 2 }, 2, 3]], 'a drop-off against the square it wanted');
  same(R.terrain.changes.map(c => [c.by, c.name, c.from, c.to]), [[4, 'Open the Sluice', 'open', 'water']], 'a changed square and who changed it');
  same(R.formations.snapshots.map(s => [s.player, s.onBoard, s.formations[0].units]), [[0, 3, [4]]], 'who stands in a formation as the phase ends');
  same(R.formations.attacks.map(a => [a.attacker, a.side, a.formation, a.with, a.without, a.gain]), [[4, 'attacker', 'azure_dragon', 2, 1.5, 0.5]], 'an attack from a formation, with and without it');
  assert(hidden.length === 0, 'the formation stands again after the read');
});

check('the mechanics record reads drop-offs, changed squares and formation uptime as text', () => {
  const { mechanicsRecord } = require('./battle_report/mechanics.cjs');
  const report = fixture();
  report.transport = { boards: [], rides: [{ round: 1, at: 'start', uid: 3, col: 2, row: 2, cargo: [{ uid: 4, wants: { col: 5, row: 4, turnsAway: 1 } }] }],
    drops: [{ round: 1, phase: 'MOVEMENT', transport: 3, from: { col: 2, row: 2 }, uid: 4, to: { col: 3, row: 2 }, wants: { col: 5, row: 4 }, wantDist: 2, objDist: 3 }] };
  report.terrain = { changes: [{ round: 2, phase: 'ACTION', col: 3, row: 3, from: 'open', to: 'water', by: 1, name: 'Open the Sluice' }],
    after: [{ round: 3, col: 3, row: 3, terrain: 'water', on: [], near: [3] }] };
  report.formations = { snapshots: [{ round: 1, player: 0, onBoard: 2, formations: [{ id: 'azure_dragon', name: 'Azure Dragon', units: [1, 2] }], surging: null }],
    attacks: [{ round: 1, attacker: 1, target: 3, side: 'attacker', formation: 'azure_dragon', gain: 0.5 }, { round: 1, attacker: 3, target: 2, side: 'target', formation: 'azure_dragon', gain: 0.25 }] };
  const m = mechanicsRecord(report);
  assert(m.transport.lines.some(l => l.includes('Yankee gets out of Xray') && l.includes('2 square(s) off')), 'the drop-off line');
  same(m.transport.sum.wantDist, [2], 'drop-offs summed');
  assert(m.terrain.lines[0].includes('Alpha (Open the Sluice): (3,3) open -> water') && m.terrain.lines[1].includes('beside it Xray'), 'the change and who stood by it');
  assert(m.formations.lines[0].includes('2/2 units in 1 formation(s): Azure Dragon [Alpha, Bravo]'), 'the uptime line');
  same(m.formations.sum.byFormation.azure_dragon, { by: 1, on: 1, gainBy: 0.5, gainOn: 0.25 }, 'attacks by and on the formation');
  same(mechanicsRecord(fixture()), { transport: null, terrain: null, formations: null }, 'nothing recorded, nothing read');
});

check('a move the next one undoes is flagged: back beside its start, or away from the objective it moved toward', () => {
  const report = fixture();
  report.snaps[0].objectives = [{ col: 5, row: 5, vp: 2 }];
  const mv = (seq, round, phase, uid, from, to, extra) => Object.assign({ seq, round, phase, uid, name: ['', 'Alpha', 'Bravo', 'Xray', 'Yankee'][uid],
    player: uid < 3 ? 0 : 1, from: { col: from[0], row: from[1] }, to: { col: to[0], row: to[1] } }, extra);
  report.moves = [
    mv(1, 1, 'MOVEMENT', 1, [0, 0], [3, 0]), mv(2, 1, 'ACTION', 1, [3, 0], [1, 0]),     // out 3, back beside its start
    mv(3, 2, 'MOVEMENT', 1, [1, 0], [1, 3]),                                             // then a march: no flag
    mv(4, 1, 'MOVEMENT', 2, [2, 2], [4, 4]), mv(5, 2, 'MOVEMENT', 2, [4, 4], [1, 5]),     // toward (5,5), then away past its start
    mv(6, 2, 'ACTION', 2, [1, 5], [1, 6]),
    mv(7, 1, 'MOVEMENT', 3, [6, 6], [4, 6]), mv(8, 2, 'MOVEMENT', 3, [4, 6], [6, 6], { charged: true }),   // a CHARGE: a fight's move
    mv(9, 1, 'MOVEMENT', 4, [7, 7], [5, 7]), mv(10, 2, 'MOVEMENT', 4, [5, 7], [7, 7]),                     // a Fall Back: its own record
    mv(11, 2, 'ACTION', 4, [7, 7], [6, 6]), mv(12, 3, 'MOVEMENT', 4, [6, 6], [2, 6]),   // a march that bends: closes on (5,5), then leaves it, never turning back
  ];
  report.fallBacks = [{ round: 2, phase: 'MOVEMENT', uid: 4, fellBack: true, dest: { col: 7, row: 7 } }];
  const t = tempoRecord(report);
  same(t.entries.map(e => [e.name, e.back, e.objective, e.squares, e.second.round]),
    [['Alpha', true, null, 2, 1], ['Bravo', false, { col: 5, row: 5 }, 2, 2]], 'the two undone pairs, and nothing else');
  same(t.rows.map(r => [r.name, r.moves, r.undone, r.back, r.objective, r.squares]),
    [['Alpha', 3, 1, 1, 0, 2], ['Bravo', 3, 1, 0, 1, 2], ['Xray', 2, 0, 0, 0, 0], ['Yankee', 4, 0, 0, 0, 0]], 'by unit');
  same(Object.keys(t.byRound), ['1', '2'], 'each pair under the round of its second move');
  same(tempoLine(t.entries[0]), 'Alpha: R1 MOVEMENT 0,0 -> 3,0, R1 ACTION -> 1,0 (back beside its start, 2 squares lost)', 'the digest line');
  const perArmy = unitTempo(report, t, a => a, name => name);
  same(perArmy[0].map(u => [u.type, u.moves, u.undone]), [['Alpha', 3, 1], ['Bravo', 3, 1]], 'the batch\'s per-battle units, by army');
  const types = tempoTypeTable({ games: [{ tempo: perArmy }, { tempo: perArmy }] });
  same(types.filter(x => x.type === 'Alpha').map(x => [x.copies, x.undonePer, x.share]), [[2, 1, 1 / 3]], 'per copy per battle across a batch');
  const html = buildPage({ report });
  assert(html.includes('id="tempo"') && html.includes('href="#tempo"') && html.includes('toward the objective at 5,5, then away'), 'the page shows the record');
});

check('the featured battle is the batch\'s closest, replayed by its seed, sides and map', () => {
  const g = (seed, vp, round, extra) => Object.assign({ seed, vp, round, map: 'ACROPOLIS', swapped: false, mapGiven: false }, extra);
  const games = [g(1, [30, 2], 4), g(2, [20, 15], 5), g(3, [12, 17], 6), null];
  same(closestGame(games).g.seed, 3, 'a 5-VP margin twice: the longer battle');
  same(closestGame([g(1, [30, 2], 4)]).g.seed, 1, 'every battle a landslide: the closest of them');
  same(closestGame([]), null, 'no battle, no pick');
  const args = { a: { faction: 'f0', formation: 'preset:a' }, b: { faction: 'f1', formation: 'preset:b' } };
  same(replayCommand(args, g(3, [12, 17], 6, { swapped: true }), 'x'),
    'node scripts/battle_report/record.cjs --a f1/preset:b --b f0/preset:a --seed 3 --name x', 'a swapped battle plays its sides swapped');
  same(replayCommand(args, g(3, [12, 17], 6, { mapGiven: true, map: 'TWIN LAKES' }), 'x'),
    'node scripts/battle_report/record.cjs --a f0/preset:a --b f1/preset:b --seed 3 --map "TWIN LAKES" --name x', 'a map the batch named');
});

check('the AI perf recorder times each turn and its stages, and changes no answer', () => {
  // The AI's own functions, stubbed: each moves a fake clock and calls what the real one would.
  let clock = 0;
  const page = { console: { warn: () => {} }, G: { phase: 'BATTLE', battlePhase: 'MOVEMENT', round: 2 }, performance: { now: () => clock } };
  page.window = page;
  vm.createContext(page);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'battle_report', 'page_ai_perf.js'), 'utf8'), page);
  Object.assign(page, {
    aiScoreDestination: () => { clock += 1; return 5; },
    aiDecideMovement: () => { clock += 10; page.aiScoreDestination(); page.aiScoreDestination(); return 'decided'; },
    aiPrepareTurn: () => { clock += 3; },
    aiChooseAction: player => { page.aiPrepareTurn(); page.aiDecideMovement(); return { type: 'move', uid: 7, player }; },
    _aiInterjectionChoice: (ctx, cands) => { clock += 4; return cands[0]; },
    aiDeployOne: () => { clock += 2; return { col: 1, row: 1 }; },
  });
  const R = {};
  page.installAiPerfRecorder(R);
  const action = page.aiChooseAction(1);
  same(action, { type: 'move', uid: 7, player: 1 }, 'the decision itself, unchanged');
  same(R.aiPerf.decisions.length, 1, 'one turn decided');
  const d = R.aiPerf.decisions[0];
  same([d.round, d.phase, d.player, d.type, d.uid, d.ms], [2, 'MOVEMENT', 1, 'move', 7, 15], 'the turn, its action and its time');
  same(d.parts, { aiPrepareTurn: [3, 1], aiScoreDestination: [0, 2], aiDecideMovement: [12, 1] }, 'each stage timed, the scoring counted');
  const cand = { id: 'overwatch:5', seam: 'overwatch', player: 0 };
  same(page._aiInterjectionChoice({}, [cand]), cand, 'a reaction choice, unchanged');
  page.aiDeployOne(0);
  same(R.aiPerf.picks.map(p => [p.kind, p.seam || null, p.ms]), [['interjection', 'overwatch', 4], ['deploy', null, 2]], 'other choices timed');
  page.aiDecideMovement();
  same(R.aiPerf.outside.aiDecideMovement, [12, 1], 'a stage outside any decision is kept apart');

  const report = { aiPerf: R.aiPerf, meta: { map: 'M', armyNames: ['A', 'B'], seed: 1, lean: true }, result: { round: 2 },
    units: [{ uid: 7, name: 'Legionnaire Squad' }],
    perf: { samples: [{ label: 'start', at: 0, heapUsed: 10, script: 0 }, { label: 'end', at: 5000, heapUsed: 30, script: 100 }], retained: 20 } };
  const rec = aiPerfRecord(report, 'x', null);
  same([rec.decisions.all.n, rec.decisions.all.mean, rec.aiMs, rec.scriptMs], [1, 15, 21, 100], 'the battle\'s turns and AI time');
  same(rec.stages.map(s => [s.name, s.share]), [['aiDecideMovement', 80], ['aiPrepareTurn', 20], ['aiScoreDestination', 0]], 'each stage\'s share of the turns');
  same(rec.slowest[0].unit, 'Legionnaire Squad', 'the slowest decisions name their unit');
  same([rec.memory.start, rec.memory.peak, rec.memory.retained], [10, 30, 20], 'memory');
  same(aiPerfBatch([{ label: 'x', report }, { label: 'y', report }], null).pooled.decisions.all.n, 2, 'a batch pools every turn');
  same(topLevel([{ t: 0, ms: 10 }, { t: 2, ms: 3 }, { t: 12, ms: 1 }]).map(r => r.t), [0, 12], 'a choice timed inside another counts once');
  same(stats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { n: 10, total: 55, mean: 5.5, median: 6, p90: 10, p99: 10, max: 10 }, 'the quantiles');
  same([categoryOf('engine/modules/ai/x.js'), categoryOf('engine/ui/board.js'), categoryOf('engine/modules/combat/x.js'), categoryOf(null)],
    ['AI', 'UI', 'rules engine', 'other'], 'a function\'s category is its file\'s');
});

check('a CPU profile is summed by function: its own time, and its total counted once a stack', () => {
  const frame = (name, line) => ({ functionName: name, url: name.startsWith('(') ? '' : 'page', lineNumber: line });
  const profile = {
    nodes: [
      { id: 1, callFrame: frame('(root)', 0), children: [2, 5, 6] },
      { id: 2, callFrame: frame('outer', 10), children: [3] },
      { id: 3, callFrame: frame('inner', 20), children: [4] },
      { id: 4, callFrame: frame('outer', 10), children: [] },     // recursion: outer again
      { id: 5, callFrame: frame('(garbage collector)', 0), children: [] },
      { id: 6, callFrame: frame('(idle)', 0), children: [] },
    ],
    // Each sample's time is the gap to the next: 2, 3, 4, 1 ms, and 0 for the last.
    samples: [3, 4, 2, 5, 6], timeDeltas: [0, 2000, 3000, 4000, 1000],
  };
  const p = summarizeProfile(profile);
  const by = name => p.functions.find(f => f.name === name);
  same([p.totalMs, p.gcMs, p.idleMs], [10, 1, 0], 'the battle, its garbage collection and its idle time');
  same([by('inner').selfMs, by('inner').totalMs], [2, 5], 'inner: its own sample, and the one below it');
  same([by('outer').selfMs, by('outer').totalMs], [7, 9], 'outer: its own two samples, and its recursion counted once');
});

check('tournament: a seeded draw, best-of-3 matches with drawn and failed games, the next round, a replay', () => {
  const entrants = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(id => ({ faction: 'f', formation: 'preset:' + id, name: id.toUpperCase() }));
  const first = bracket.drawBracket(entrants, 7);
  same(first.label, 'Quarter-finals', 'eight entrants open with the quarter-finals');
  same(bracket.drawBracket(entrants, 7), first, 'the same seed draws the same bracket');
  assert(JSON.stringify(bracket.drawBracket(entrants, 8)) !== JSON.stringify(first), 'another seed draws another');
  same(first.matches.flatMap(m => [m.a.name, m.b.name]).sort().join(''), 'ABCDEFGH', 'every entrant is drawn once');
  let threw = false;
  try { bracket.drawBracket(entrants.slice(0, 6), 1); } catch (e) { threw = true; }
  assert(threw, 'six entrants are no knockout bracket');

  const game = (n, winner, vp, extra) => Object.assign({ n, seed: n, swapped: n % 2 === 0, winner, vp, round: 5, reason: 'VP', errors: 0, file: 'games/x-g' + n + '.json' }, extra);
  const m = first.matches[0];
  same(bracket.gamesToPlay(m, 3), 2, 'a fresh best-of-3 plays two games at once');
  same([bracket.gamePlan(100, 0, 0, m, 1).swapped, bracket.gamePlan(100, 0, 0, m, 2).swapped], [false, true], 'the armies take Player A in turn');
  m.games = [game(1, 0, [20, 10]), game(2, 1, [8, 15])];
  same([bracket.matchResult(m, 3), bracket.gamesToPlay(m, 3), bracket.nextGameNumbers(m, 1)], [null, 1, [3]], 'at 1-1 one more game decides');
  m.games.push(game(3, null, [12, 12]));
  same(bracket.matchResult(m, 3), null, 'a drawn game counts for neither');
  m.games.push(game(4, null, [0, 0], { failed: 'stalled' }));
  same([bracket.matchStanding(m).played, bracket.nextGameNumbers(m, 1)], [3, [4]], 'a failed game counts for nothing and is played again first');
  m.games[3] = game(4, 1, [10, 25]);
  same(bracket.matchResult(m, 3), { winner: 1, by: 'games' }, 'two wins take the match');
  const v = first.matches[1];
  v.games = [1, 2, 3, 4, 5].map(n => game(n, null, n === 5 ? [11, 10] : [10, 10]));
  same(bracket.matchResult(v, 3), { winner: 0, by: 'vp' }, 'past best-of + 2 games without two wins, more VP over the match takes it');
  first.matches.slice(2).forEach(x => { x.games = [game(1, 0, [9, 1]), game(2, 0, [9, 1])]; });
  const state = { seed: 100, rounds: [first] };
  const second = bracket.nextRound(state, 3);
  same([second.label, second.matches.map(x => [x.a.name, x.b.name])],
    ['Semi-finals', [[m.b.name, v.a.name], [first.matches[2].a.name, first.matches[3].a.name]]], 'the winners meet in bracket order');
  state.rounds.push(second);
  threw = false;
  try { bracket.replayMatch(state, m.id); } catch (e) { threw = true; }
  assert(threw, 'replaying an earlier round asks before it drops the rounds after');
  const out = bracket.replayMatch(state, m.id, { fromGame: 3, reseed: true, dropLater: true });
  same([out.removed.map(g => g.n), out.droppedRounds, m.games.length, m.winner, m.reseed, state.rounds.length],
    [[3, 4], ['Semi-finals'], 2, null, 1, 1], 'a replay takes its games off from the one named, clears the result and the rounds after');
  assert(bracket.gamePlan(100, 0, 0, m, 3).seed !== 100 + 1000 + 10 + 3, 'a reseeded replay plays new seeds');

  bracket.settleRound(first, 3);
  first.matches[2].games[1] = game(2, 0, [9, 1], { errors: 2, round: 3, reason: 'HQ' });
  first.matches[3].games[0] = game(1, 0, [30, 12], { round: 9 });
  const text = roundSummary({ config: { name: 'Test Cup', doctrine: 'none' }, rounds: [first] }, first);
  ['page errors', 'ended by HQ in round 3', 'went 9 rounds', 'settled on vp', m.id + '  '].forEach(bit => assert(text.indexOf(bit) >= 0, 'the summary flags ' + bit + ':\n' + text));
  assert(text.indexOf(first.matches[0].id + ' g1: ended') < 0, 'a battle won on VP in 5 rounds is not flagged');
});

check('league: four pots, eight matchdays, two opponents from each pot, the table and the knockout it seeds', () => {
  const league = require('./battle_report/league_schedule.cjs');
  // 48 armies in factions of 8, 7, 7, 3, 3, six of 2 and eight of 1 - the real presets' worst crowding and more.
  const sizes = [8, 7, 7, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1];
  const entrants = [];
  sizes.forEach((n, f) => { for (let i = 0; i < n; i++) entrants.push({ faction: 'f' + f, formation: 'preset:f' + f + '_' + i, name: 'F' + f + '.' + i }); });
  same(entrants.length, 48, 'forty-eight armies');
  const { pots, days } = league.drawLeague(entrants, 11);
  same(league.drawLeague(entrants, 11).days.map(d => d.matches.map(m => m.id + m.a.name + m.b.name)),
    days.map(d => d.matches.map(m => m.id + m.a.name + m.b.name)), 'the same seed draws the same league');
  same(pots.map(p => p.length), [12, 12, 12, 12], 'four pots of twelve');
  pots.forEach(p => assert(p.filter(e => e.faction === 'f0').length === 2, 'the faction of eight sits two to a pot'));
  const potOf = new Map(pots.flatMap((p, i) => p.map(e => [e.name, i])));
  same([days.length, days.map(d => d.matches.length)], [8, [24, 24, 24, 24, 24, 24, 24, 24]], 'eight matchdays of 24 battles');
  days.forEach(d => same(new Set(d.matches.flatMap(m => [m.a.name, m.b.name])).size, 48, `every army fights once on ${d.label}`));
  const all = days.flatMap(d => d.matches);
  same(new Set(all.map(m => [m.a.name, m.b.name].sort().join('|'))).size, 192, 'no two armies meet twice');
  assert(all.every(m => m.a.faction !== m.b.faction), 'no army meets its own faction');
  assert(new Set(all.map(m => m.seed)).size === 192, 'every battle has its own seed');
  entrants.forEach(e => {
    const mine = all.filter(m => m.a === e || m.b === e);
    const opponents = mine.map(m => (m.a === e ? m.b : m.a));
    same(opponents.length, 8, e.name + ' plays eight battles');
    same([0, 1, 2, 3].map(p => opponents.filter(o => potOf.get(o.name) === p).length), [2, 2, 2, 2], e.name + ' meets two from each pot');
    same([0, 1, 2, 3].map(p => mine.filter(m => m.a === e && potOf.get(m.b.name) === p).length), [1, 1, 1, 1], e.name + ' is Player A once against each pot');
  });

  // The table: points, then VP difference, then VP scored, then the draw's order.
  const four = entrants.slice(0, 4);
  const day = { matches: [
    { a: four[0], b: four[1], result: { winner: 0, vp: [20, 10] } },
    { a: four[2], b: four[3], result: { winner: null, vp: [12, 12] } },
    { a: four[1], b: four[2], result: { winner: 1, vp: [15, 25] } },
    { a: four[3], b: four[0], result: null },
  ] };
  const table = league.leagueTable(four, [day]);
  same(table.map(r => [r.entrant.name, r.points, r.vpFor - r.vpAgainst]),
    [[four[2].name, 4, 10], [four[0].name, 3, 10], [four[3].name, 1, 0], [four[1].name, 0, -20]], 'points first, then VP difference');

  // The knockout: 9th-24th in the play-off, 1st-8th waiting in bracket order.
  const ranked = entrants.map((e, i) => ({ entrant: e, place: i + 1 }));
  const po = league.playoffRound(ranked);
  same(po.matches.map(m => [ranked.findIndex(r => r.entrant === m.a) + 1, ranked.findIndex(r => r.entrant === m.b) + 1]),
    [[16, 17], [9, 24], [13, 20], [12, 21], [15, 18], [10, 23], [14, 19], [11, 22]], 'the play-off pairs 9th with 24th ... 16th with 17th, in bracket order');
  let threw = false;
  try { league.roundOf16(ranked, po); } catch (e) { threw = true; }
  assert(threw, 'the round of 16 waits for the play-off');
  po.matches.forEach((m, i) => { m.winner = i % 2; });
  const r16 = league.roundOf16(ranked, po);
  same(r16.matches.map(m => [ranked.findIndex(r => r.entrant === m.a) + 1, ranked.findIndex(r => r.entrant === m.b) + 1]),
    [[1, 16], [8, 24], [4, 13], [5, 21], [2, 15], [7, 23], [3, 14], [6, 22]], '1st meets the 16th-17th winner, 8th the 9th-24th winner');
});

async function checkAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL ${name}: ${err && err.message ? err.message : err}`);
  }
}

(async () => {
  await checkAsync('tournament: the recorder pool starts no more browsers than its size, however slow they are to start', async () => {
    const { recorderPool } = require('./battle_report/tournament.cjs');
    let started = 0, stopped = 0;
    const slowStart = () => { const id = ++started; return new Promise(resolve => setTimeout(() => resolve({ id, stop: async () => { stopped++; } }), 20)); };
    const pool = recorderPool(3, slowStart);
    const used = [];
    await Promise.all(Array.from({ length: 10 }, async () => {
      const r = await pool.acquire();
      used.push(r.id);
      await new Promise(resolve => setTimeout(resolve, 5));
      pool.release(r);
    }));
    await pool.stop();
    same([started, used.length, new Set(used).size, stopped], [3, 10, 3, 3], 'ten battles share three browsers, all stopped at the end');
  });
  console.log(`[BATTLE-REPORT] ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
