'use strict';
// Collect per-unit and per-side numbers for Champion League Day 1, using the repo's
// battle_report modules (summarize/attribution/activity/enrich). Writes data.json.
const fs = require('fs');
const path = require('path');
const BR = '/home/user/warfront/scripts/battle_report';
const { summarize } = require(BR + '/summarize.cjs');
const { enrichCombats } = require(BR + '/page/enrich.cjs');
const DATA = '/home/user/warfront/data/editions/fantasy';
const REPORTS = process.argv[2] || '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/battle_reports';
const PREFIX = process.argv[3] || 'cl-s1-d1-d1-m';
const OUT = process.argv[4] || path.join(__dirname, 'data.json');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name))
    : (e.name.endsWith('.json') && !e.name.startsWith('_') ? [path.join(d, e.name)] : []));
}
const WEAPONS = {};
walk(DATA + '/weapons').forEach(f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); WEAPONS[j.id] = j; });
const UNITS = {};
walk(DATA + '/units').forEach(f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); UNITS[j.faction + ':' + j.id] = Object.assign(j, { file: f }); });

function profileOf(wref) {
  const w = WEAPONS[wref.weapon_id];
  if (!w) return null;
  const pid = wref.profile_id || w.default_profile_id;
  return (w.profiles || []).find(p => p.id === pid) || (w.profiles || [])[0] || null;
}
// Template facts: models, OC, HP, best DEF, ranged and melee weight (sum over models of
// attacks x DMG), tags.
function template(tid) {
  const u = UNITS[tid];
  if (!u) return null;
  let models = 0, oc = 0, hp = 0, rangedW = 0, meleeW = 0, maxRange = 0, ocSplit = false;
  let def = null;
  const weaponNames = new Set();
  (u.composition || []).forEach(c => {
    const n = c.count || 1;
    const st = c.stats || {};
    models += n; oc += n * (parseInt(String(st.OC), 10) || 0); if (/\//.test(String(st.OC))) ocSplit = true; hp += n * (Number(st.HP) || 0);
    const d = parseInt(String(st.DEF || '7'), 10);
    if (def == null || d < def) def = d;
    let bestR = 0, bestM = 0;
    (c.weapons || []).forEach(wr => {
      const p = profileOf(wr);
      if (!p) return;
      weaponNames.add(p.name);
      const s = p.stats || {};
      const dmg = Number(s.DMG) || 1;
      if (p.attack_type === 'melee' || (s.RANGE || 0) === 0) bestM = Math.max(bestM, (Number(s.AR) || 1) * dmg);
      else { bestR = Math.max(bestR, (Number(s.FR) || 1) * dmg); maxRange = Math.max(maxRange, Number(s.RANGE) || 0); }
    });
    rangedW += n * bestR; meleeW += n * bestM;
  });
  return { ocSplit, id: u.id, name: u.name, faction: u.faction, subfaction: u.subfaction || null, rp: u.rp, tags: u.tags || [], models, oc, hp, def,
    rangedW, meleeW, maxRange, weapons: [...weaponNames], abilities: (u.abilities || []).map(a => a.ability_id), gear: (u.gear || []).map(g => g.gear_id) };
}

const dirs = fs.readdirSync(REPORTS).filter(d => d.startsWith(PREFIX)).sort();
const battles = [];
const units = [];
dirs.forEach(dir => {
  const file = path.join(REPORTS, dir, 'report.json');
  if (!fs.existsSync(file)) return;
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  enrichCombats(report);
  const s = summarize(report);
  const id = dir.replace(PREFIX, 'M');
  const meta = report.meta;
  const r = report.result || {};
  const final = report.snaps[report.snaps.length - 1];
  const endSnaps = report.snaps.filter(x => /^end of round|^final/.test(x.label));
  // Per attacker: damage and kills by attack kind.
  const by = {};
  const blank = () => ({ dmg: {}, kills: {}, ff: 0, attacks: {} });
  const sideDmg = [{}, {}];
  const sideKills = [{}, {}];
  report.combats.forEach(c => {
    let kind = c.kind;
    if (kind === 'ranged' && c.phase === 'MOVEMENT') kind = 'overwatch';
    const att = c.attacker;
    (c.losses || []).forEach(l => {
      if (l.player == null) return;
      const dealer = 1 - l.player;
      // A melee record's losses on the attacker's own side are the target striking back.
      let who = att;
      let k = att ? kind : 'effect';
      if (att && att.player === l.player) {
        if (kind === 'melee' && c.target && c.target.uid != null && c.target.player !== l.player) { who = c.target; k = 'melee'; }
        else { if (att.uid != null) { (by[att.uid] = by[att.uid] || blank()).ff += l.lost || 0; } return; }
      }
      sideDmg[dealer][k] = (sideDmg[dealer][k] || 0) + (l.lost || 0);
      if (l.killed) sideKills[dealer][k] = (sideKills[dealer][k] || 0) + 1;
      if (who && who.uid != null) {
        const b = by[who.uid] = by[who.uid] || blank();
        b.dmg[k] = (b.dmg[k] || 0) + (l.lost || 0);
        if (l.killed) b.kills[k] = (b.kills[k] || 0) + 1;
      }
    });
    if (att && att.uid != null) { const b = by[att.uid] = by[att.uid] || blank(); b.attacks[kind] = (b.attacks[kind] || 0) + 1; }
  });
  const scoreBy = {}; s.scoring.rows.forEach(x => { scoreBy[x.uid] = x; });
  const actBy = {}; s.activity.rows.forEach(x => { actBy[x.uid] = x; });
  const deployed = new Set((meta.armies || []).flat().map(u => u.uid));
  const metaBy = {}; (meta.armies || []).flat().forEach(u => { metaBy[u.uid] = u; });
  const rounds = s.rounds.length;
  report.units.forEach(u => {
    const t = template(u.templateId) || {};
    const st = u.stats || {};
    const sc = scoreBy[u.uid] || {};
    const ac = actBy[u.uid] || {};
    const b = by[u.uid] || blank();
    const m = metaBy[u.uid] || {};
    // OC on the board at each round end (scaled by surviving models; SUPPRESSED counts 0) and
    // rounds it stood in an Objective Area.
    let ocRounds = 0, onObjRounds = 0, boardRounds = 0;
    endSnaps.forEach(sn => {
      const su = sn.units.find(x => x.uid === u.uid);
      if (!su || !su.alive || su.col < 0) return;
      boardRounds += 1;
      const startModels = m.models || t.models || 1;
      let oc = (t.oc || 0) * (su.models / startModels);
      if ((su.statuses || []).includes('SUPPRESSED')) oc = 0;
      ocRounds += oc;
      if ((sn.objectives || []).some(o => Math.max(Math.abs(o.col - su.col), Math.abs(o.row - su.row)) <= 1)) onObjRounds += 1;
    });
    units.push({
      battle: id, isHQ: !!u.isHQ, player: u.player, side: meta.armyNames[u.player], faction: meta.factions[u.player], uid: u.uid, name: u.name,
      tid: u.templateId, type: t.name || u.name.replace(/ \d+$/, ''), rp: u.rp || 0, baseRp: t.rp, character: !!u.character,
      tags: u.tags || t.tags || [], models: m.models || t.models, hp: m.hp || t.hp, oc: t.oc, def: t.def, rangedW: t.rangedW, meleeW: t.meleeW,
      maxRange: t.maxRange, arrived: !deployed.has(u.uid), leads: m.leads || null, joined: m.joined || null,
      alive: !!u.alive, dealt: st.totalDmgDealt || 0, taken: st.totalDmgTaken || 0, killsN: (st.kills || []).length, killRp: (st.kills || []).reduce((t, k) => t + ((metaBy[k.uid] || report.units.find(x => x.uid === k.uid) || {}).rp || 0), 0), killList: (st.kills || []).map(k => k.name), killDetail: (st.kills || []).map(k => ({ uid: k.uid, round: k.round, rp: ((metaBy[k.uid] || report.units.find(x => x.uid === k.uid) || {}).rp || 0) })), modelsKilled: st.modelsKilled || 0,
      dmgByKind: b.dmg, killsByKind: b.kills, attacksByKind: b.attacks, ff: b.ff,
      vp: sc.total || 0, vpObj: sc.objectives || 0, vpPrim: sc.primary || 0, vpMis: sc.missions || 0, pivotal: sc.pivotal || 0, enemyGain: sc.enemyGain || 0,
      idle: ac.idle || 0, idleMoved: ac.idleMoved || 0, overwatchN: ac.overwatch || 0, actions: ac.actions || 0,
      act: { movement: ac.movement || 0, ranged: ac.ranged || 0, melee: ac.melee || 0, ability: ac.ability || 0, magic: ac.magic || 0 },
      rounds, ocRounds, onObjRounds, boardRounds,
    });
  });
  const vpSrc = p => {
    const o = { objectives: 0, primary: 0, missions: 0, other: 0 };
    s.economy.forEach(e => { Object.keys(o).forEach(k => { o[k] += e.players[p].vp[k]; }); });
    return o;
  };
  const pools = p => {
    const o = {};
    s.economy.forEach(e => Object.keys(e.players[p].pools).forEach(id => {
      const f = e.players[p].pools[id];
      o[id] = o[id] || { gained: 0, spent: 0, held: 0 };
      o[id].gained += f.gained; o[id].spent += f.spent; o[id].held = f.held;
    }));
    return o;
  };
  const objByRound = p => s.economy.map(e => e.players[p].vp.objectives);
  battles.push({
    id, map: meta.map, seed: meta.seed, initiative: meta.initiative, winner: r.winner, reason: r.reason, round: r.round, vp: r.vp,
    sides: [0, 1].map(p => ({
      name: meta.armyNames[p], faction: meta.factions[p], factionName: (meta.factionNames || [])[p], preset: meta.sides[p].formation,
      rp: s.armies[p].rp, fieldedRp: s.armies[p].fieldedRp, lostRp: s.armies[p].lostRp, units: s.armies[p].units - 1,
      arrivedUnits: s.armies[p].arrivedUnits, lostUnits: s.armies[p].lostUnits,
      vpSrc: vpSrc(p), objByRound: objByRound(p), unassigned: s.scoring.unassigned[p], dmg: sideDmg[p], kills: sideKills[p],
      primary: s.primary[p].card ? s.primary[p].card.name : null, primaryVp: s.primary[p].total,
      missionsKept: s.missions[p].length, missionsDone: s.missions[p].filter(m => m.outcome === 'completed').length,
      missionNames: s.missions[p].map(m => m.name + ':' + m.outcome),
      pools: pools(p), cp: s.economy.reduce((t, e) => ({ gained: t.gained + e.players[p].cp.gained, spent: t.spent + e.players[p].cp.spent }), { gained: 0, spent: 0 }),
      finalPools: final.players[p].pools,
    })),
  });
});
fs.writeFileSync(OUT, JSON.stringify({ battles, units }, null, 1));
console.log('battles', battles.length, 'units', units.length, '->', OUT);
