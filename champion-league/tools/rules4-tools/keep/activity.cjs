'use strict';

// scripts/battle_report/activity.cjs - what each unit did with its APt, from the
// activity the page recorded (page_activity.js). Pure: no page, no files.
//
// Per unit: its action scores - +1 for each movement (APt spent in the Movement
// Phase), advance (an ADVANCE in the Movement Phase), ranged, melee (a counterattack
// included), ability and magic action, and each Battle Round it held an objective (in an
// Objective Area at the round's scoring, its OC counting there: not idle - the user's
// ruling, 2026-10-29) - and its inaction score: +1 for each Battle Round it stood with
// APt it could spend, spent none and took no action (holding an objective is one, and
// so is an ADVANCE; page_activity.js decides), -0.25 for each Overwatch shot it fired
// after holding. An idle round it moved in (report.moves; a joined pair's move is its
// CHARACTER's too) counts as idleMoved: the walk that came to nothing.
//
// An ADVANCE is not idle, but a round the unit ADVANCED and did nothing else - no other
// action, no Overwatch shot - is counted apart, as advanceOnly (the user's ruling,
// 2026-10-30: "advancing is not idle, but a unit that only advance is a problem too. It
// lost out on shooting usually"). It is not in the inaction score; it is there to be
// looked at. A record made before the ADVANCE was an entry of its own has it only in its
// moves (`advanced`, a pair's both units): such a record's ADVANCEs are read from there,
// and the idle round of a unit that ADVANCED is its advance-only round.
//
// A unit that fought for both sides (a seizure) has a row for each, by its side as it
// happened (sides.cjs). A record made before the activity existed has none: `recorded`
// is false; one made before holding an objective was recorded counts such a round idle.

const { activitySides, markSeized } = require('./sides.cjs');

const ACTIONS = ['movement', 'advance', 'ranged', 'melee', 'ability', 'magic', 'objective'];
const OVERWATCH_CREDIT = 0.25;

// The record's activity, its ADVANCEs included: as recorded, or - a record made before
// they were entries - from its moves, each unit's idle round in a round it ADVANCED read
// as that ADVANCE.
function _withAdvances(report, uidOf) {
  const events = report.activity || [];
  if (events.some(e => e.kind === 'advance')) return events;
  const advanced = {};
  const see = (m, uid) => {
    const key = m.round + ':' + uid;
    if (uid != null && !advanced[key]) advanced[key] = { round: m.round, phase: m.phase, uid, player: m.player };
  };
  (report.moves || []).filter(m => m.advanced).forEach(m => {
    see(m, m.uid);
    if (m.partner) see(m, uidOf(m.partner, m.player));
  });
  if (!Object.keys(advanced).length) return events;
  return events.filter(e => !(e.kind === 'idle' && advanced[e.round + ':' + e.uid]))
    .concat(Object.values(advanced).map(a => Object.assign({ kind: 'advance' }, a)));
}

function activityRecord(report) {
  const sideOf = activitySides(report);
  const info = {};
  (report.meta.armies || []).flat().forEach(u => { info[u.uid] = u; });
  report.units.forEach(u => { info[u.uid] = Object.assign({}, info[u.uid], u); });
  // Who moved in which Battle Round: the unit moved, and the CHARACTER it carries.
  const uidOf = (name, player) => (Object.values(info).find(u => u.name === name && u.player === player) || {}).uid;
  const events = _withAdvances(report, uidOf);
  const moved = new Set();
  (report.moves || []).forEach(m => {
    moved.add(m.round + ':' + m.uid);
    if (m.partner) moved.add(m.round + ':' + uidOf(m.partner, m.player));
  });
  const rows = {};
  const row = (uid, player) => {
    const key = uid + '|' + player;
    if (!rows[key]) {
      const u = info[uid] || { uid: Number(uid), name: 'unit ' + uid, player: null, rp: 0 };
      const final = player == null || player === u.player;
      rows[key] = { uid: u.uid, name: u.name, player: player == null ? u.player : player, rp: u.rp || 0, alive: final ? u.alive !== false : true,
        isHQ: !!u.isHQ, idle: 0, idleMoved: 0, overwatch: 0, inaction: 0, actions: 0, idleRounds: [], idleWhy: [],
        advanceOnly: 0, advanceOnlyRounds: [] };
      ACTIONS.forEach(k => { rows[key][k] = 0; });
    }
    return rows[key];
  };
  // What each row did in each Battle Round, for its advance-only rounds.
  const kindsIn = {};
  events.forEach(e => {
    const r = row(e.uid, sideOf(e));
    const at = r.uid + '|' + r.player + '|' + e.round;
    (kindsIn[at] = kindsIn[at] || { r, round: e.round, kinds: new Set() }).kinds.add(e.kind);
    if (e.kind === 'idle') {
      r.idle += 1; r.idleRounds.push(e.round);
      if (moved.has(e.round + ':' + e.uid)) r.idleMoved += 1;
      // The best action the AI had when it passed (page_activity.js), when recorded.
      if (e.why) r.idleWhy.push(Object.assign({ round: e.round }, e.why));
    } else if (e.kind === 'overwatch') r.overwatch += 1;
    else if (ACTIONS.includes(e.kind)) { r[e.kind] += 1; r.actions += 1; }
  });
  // The rounds a row ADVANCED and did nothing else: no other action, no Overwatch shot.
  const advanceOnlyByRound = {};
  Object.values(kindsIn).sort((a, b) => a.round - b.round).forEach(({ r, round, kinds }) => {
    if (kinds.size !== 1 || !kinds.has('advance')) return;
    r.advanceOnly += 1; r.advanceOnlyRounds.push(round);
    (advanceOnlyByRound[round] = advanceOnlyByRound[round] || []).push({ uid: r.uid, player: r.player });
  });
  const list = markSeized(report, Object.values(rows).map(r => Object.assign(r, { inaction: r.idle - OVERWATCH_CREDIT * r.overwatch })));
  const idleByRound = {};
  events.filter(e => e.kind === 'idle').forEach(e => { (idleByRound[e.round] = idleByRound[e.round] || []).push(e.uid); });
  return {
    recorded: !!report.activity,
    rows: list,
    idleByRound,
    advanceOnlyByRound,
    byInaction: list.slice().sort((a, b) => (b.inaction - a.inaction) || (a.actions - b.actions) || a.name.localeCompare(b.name)),
    byAdvanceOnly: list.filter(r => r.advanceOnly > 0)
      .sort((a, b) => (b.advanceOnly - a.advanceOnly) || a.name.localeCompare(b.name)),
  };
}

// One battle's units, by army, each with its activity (batch.cjs), every unit fielded.
function unitActivity(report, record, playerOfArmy, unitType) {
  // A unit that fought for both sides counts all it did under the army that ends with it.
  const byUid = {};
  record.rows.forEach(r => {
    const t = byUid[r.uid] = byUid[r.uid] || {};
    ['inaction', 'idle', 'idleMoved', 'overwatch', 'advanceOnly'].concat(ACTIONS).forEach(k => { t[k] = (t[k] || 0) + (r[k] || 0); });
  });
  return [0, 1].map(a => report.units.filter(u => u.player === playerOfArmy(a) && !u.isHQ).map(u => {
    const r = byUid[u.uid] || {};
    const out = { type: unitType(u.name), rp: u.rp || 0, inaction: r.inaction || 0, idle: r.idle || 0, idleMoved: r.idleMoved || 0,
      overwatch: r.overwatch || 0, advanceOnly: r.advanceOnly || 0 };
    ACTIONS.forEach(k => { out[k] = r[k] || 0; });
    return out;
  }));
}

// A batch's unit types, by army: per copy per battle, the inaction score and each action.
function activityTypeTable(batch) {
  const types = {};
  batch.games.forEach(g => (g.activity || []).forEach((list, army) => list.forEach(u => {
    const key = army + '|' + u.type;
    const t = types[key] = types[key] || { army, type: u.type, rp: u.rp, copies: 0, inaction: 0, idle: 0, idleMoved: 0, overwatch: 0, advanceOnly: 0 };
    t.copies += 1; t.inaction += u.inaction; t.idle += u.idle; t.idleMoved += u.idleMoved || 0; t.overwatch += u.overwatch;
    // A batch played before the advance-only rounds were counted has none.
    t.advanceOnly += u.advanceOnly || 0;
    // A batch played before an action was recorded (an objective held) has none of it.
    ACTIONS.forEach(k => { t[k] = (t[k] || 0) + (u[k] || 0); });
  })));
  return Object.values(types).map(t => {
    const per = { inactionPer: t.inaction / t.copies, idleMovedPer: t.idleMoved / t.copies, advanceOnlyPer: t.advanceOnly / t.copies };
    ACTIONS.forEach(k => { per[k + 'Per'] = t[k] / t.copies; });
    return Object.assign(t, per);
  });
}

module.exports = { activityRecord, unitActivity, activityTypeTable, ACTIONS, OVERWATCH_CREDIT };
