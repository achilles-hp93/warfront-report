#!/usr/bin/env node
'use strict';

// scripts/battle_report/digest.cjs - a recorded battle as text, round by round, for
// whoever writes its commentary.json: what moved, every combat point and its losses,
// what each side scored, gained and spent, the missions kept and how they ended, the
// Primary hands, the damage leaders, and the key log lines. Read this, then write.
//
//   node scripts/battle_report/digest.cjs <name, folder or record file> [--log] [--round <n>]
//
// --log adds every combat log line of each round; --round prints that round alone
// (a live record, record.cjs --live, is a record file too: live/round-<n>.json).

const fs = require('fs');
const path = require('path');
const { REPORTS_DIR } = require('./paths.cjs');
const { summarize } = require('./summarize.cjs');
const { enrichCombats } = require('./page/enrich.cjs');
const { tempoLine } = require('./tempo.cjs');
const { SEIZED_WORDS } = require('./sides.cjs');

const KEY_LINE = /MISSION COMPLETE|picks mission|EXPIRED|PRIMARY|Primary Missions revealed|HQ Command|REACTION COMMAND|DESTROYED|destroyed|CHARGE|Fall Back|Embark|Disembark|casts|uses .+!|SURRENDER|Overwatch|OVERWATCH/;

// Who scored a round's VP (page_attribution.js): each scoring moment's shares, and the
// units it hinged on.
function scoredBy(report, round, side) {
  const name = {};
  (report.meta.armies || []).flat().concat(report.units).forEach(u => { name[u.uid] = u.name; });
  return (report.attribution || []).filter(e => e.round === round).map(e => {
    const shares = Object.keys(e.shares || {}).sort((a, b) => e.shares[b] - e.shares[a])
      .map(uid => `${name[uid] || uid} ${e.shares[uid].toFixed(1)}`).join(', ');
    const hinged = Object.keys(e.pivotal || {}).map(uid => name[uid] || uid).join(', ');
    return `  ${side(e.player)} ${e.source} ${e.what} ${e.vp} VP${e.withheld ? ` (${e.withheld} withheld by the round's VP cap)` : ''}: ${shares || 'no unit'}${e.unassigned ? `, unassigned ${e.unassigned}` : ''}`
      + `${hinged ? `; hinged on ${hinged}` : ''}${e.method && e.method !== 'shapley' ? ` (${e.method})` : ''}`;
  });
}

function digest(report, { log = false, only = null } = {}) {
  enrichCombats(report);
  const s = summarize(report);
  const names = report.meta.armyNames || report.meta.sides.map(x => x.formation);
  const side = p => (p === 0 || p === 1 ? `${'AB'[p]}:${names[p]}` : 'effect');
  const out = [];
  const r = report.result || {};
  out.push(`${names[0]} (A, ${report.meta.factions[0]}) vs ${names[1]} (B, ${report.meta.factions[1]}) on ${report.meta.map}, seed ${report.meta.seed}`);
  out.push(report.result
    ? `Result: ${r.winner === 0 || r.winner === 1 ? side(r.winner) + ' wins' : 'no winner'} (${r.reason}) in round ${r.round}, VP ${(r.vp || []).join(' / ')}`
    : 'Result: the battle is still being played');
  out.push(`Initiative: ${side(report.meta.initiative)}; formation order ${JSON.stringify(report.meta.formationOrder)}`);
  [0, 1].forEach(p => {
    out.push(`Army ${side(p)} (${s.armies[p].rp} RP, ${report.meta.doctrines ? report.meta.doctrines[p] : ''}):`);
    report.meta.armies[p].forEach(u => out.push(`  ${u.name} - ${u.rp} RP, ${u.models} models, ${u.hp} HP${u.leads ? ', led by ' + u.leads : ''}${u.joined ? ', leads ' + u.joined : ''}${u.marshal ? ', Marshal' : ''}`));
  });
  s.primary.forEach(pr => {
    const offer = pr.offers[pr.offers.length - 1];
    out.push(`Primary ${side(pr.player)}: ${pr.card ? pr.card.name : 'none'} - ${pr.card ? pr.card.objective : ''}`);
    if (offer) out.push(`  hand: ${offer.cards.map(c => c.name + (c.fits === false ? ' (does not fit)' : '')).join(', ')}; picked ${offer.picked}`);
    out.push(`  scored per round: ${pr.scores.map(x => `R${x.round} ${x.vp} (count ${x.count})`).join(', ')}; total ${pr.total}`);
  });
  s.rounds.filter(round => only == null || round === only).forEach(round => {
    out.push('', `=== BATTLE ROUND ${round} ===`);
    const econ = s.economy.find(e => e.round === round);
    econ.players.forEach((pl, p) => {
      out.push(`${side(p)}: VP +${pl.vp.objectives + pl.vp.primary + pl.vp.missions + pl.vp.other} (obj ${pl.vp.objectives}, primary ${pl.vp.primary}, missions ${pl.vp.missions}) = ${pl.vp.total}; `
        + `CP +${pl.cp.gained} -${pl.cp.spent} holds ${pl.cp.held}${pl.cp.spends.length ? ' [' + pl.cp.spends.map(x => x.amount + ' ' + x.what).join('; ') + ']' : ''}`);
      Object.keys(pl.pools).forEach(id => {
        const f = pl.pools[id];
        if (f.gained || f.spent) out.push(`  ${id}: +${f.gained} -${f.spent} holds ${f.held}${f.spends.length ? ' [' + f.spends.map(x => x.amount + ' ' + x.what).join('; ') + ']' : ''}`);
      });
    });
    report.missions.filter(m => m.round === round).forEach(m => out.push(`${side(m.player)} keeps mission ${m.kept} (offered ${m.offered.join(' / ')})`));
    s.missions.forEach((list, p) => list.filter(m => m.outcomeRound === round).forEach(m => out.push(`${side(p)} mission ${m.name}: ${m.outcome}`)));
    out.push('Moves:');
    report.moves.filter(m => m.round === round).forEach(m => out.push(`  [${m.phase}] ${side(m.player)} ${m.name}${m.partner ? ' + ' + m.partner : ''} ${m.from.col},${m.from.row} -> ${m.to.col},${m.to.row}${m.charged ? ' (charge)' : ''}${m.advanced ? ' (advance)' : ''}`));
    out.push('Combat:');
    report.combats.filter(c => c.round === round).forEach(c => {
      const losses = (c.losses || []).map(l => `${l.name} -${l.lost}${l.killed ? ' DESTROYED' : ''}`).join(', ') || 'no damage';
      const named = [c.label, c.rule && c.rule !== c.label ? c.rule : null].filter(Boolean).join(', ');
      // What the attacker paid in it, apart from its losses (page_recorder.js).
      const costs = (c.costs || []).map(x => `${x.name} -${x.lost}${x.killed ? ' DESTROYED' : ''}${x.rule ? ' (' + x.rule + ')' : ''}`).join(', ');
      out.push(`  [${c.phase}] ${c.kind}${named ? ' (' + named + ')' : ''}${c.friendlyFire ? ' FRIENDLY FIRE' : ''}: ${c.attacker ? side(c.attacker.player) + ' ' + c.attacker.name : 'effect'}${c.target && c.target.name ? ' -> ' + c.target.name : ''}: ${losses}${costs ? '; cost paid: ' + costs : ''}`);
    });
    const idle = (s.activity.idleByRound[round] || []).map(uid => {
      // The unit's row for the side it stood on that round (a seizure gives it two).
      const u = s.activity.rows.find(r => r.uid === uid && r.idleRounds.includes(round));
      if (!u) return uid;
      // The best action the AI had when it passed, if it was asked.
      const why = u.idleWhy.find(w => w.round === round);
      const reason = !why ? '' : why.action ? ` (best: ${why.action}, ${why.score})` : ' (no legal action)';
      return `${'AB'[u.player]}:${u.name}${reason}`;
    });
    if (s.activity.recorded) out.push(`Idle (APt to spend, none spent): ${idle.join(', ') || 'none'}`);
    // The units that ADVANCED this round and did nothing else (activity.cjs advanceOnly).
    const advanced = (s.activity.advanceOnlyByRound[round] || []).map(a => {
      const u = s.activity.rows.find(r => r.uid === a.uid && r.player === a.player);
      return u ? `${'AB'[u.player]}:${u.name}` : a.uid;
    });
    if (s.activity.recorded) out.push(`Advanced, nothing else: ${advanced.join(', ') || 'none'}`);
    // Each move this round that undid the unit's last (tempo.cjs).
    const undone = s.tempo.byRound[round] || [];
    if (undone.length) out.push('Moves undone:', ...undone.map(e => `  ${side(e.player)} ${tempoLine(e)}`));
    // Each command, ability, spell and Miracle used this round, and what it bought (effects.cjs).
    if (s.effects) {
      const used = s.effects.filter(e => e.round === round);
      if (used.length) out.push('Commands and abilities:', ...used.map(e => `  [${e.phase}] ${side(e.player)} ${e.name}${e.target ? ' on ' + e.target : ''}: ${e.verdict} - ${e.why.join('; ') || 'no change'}`));
    }
    // What each passive rule changed this round (passives.cjs).
    const passive = s.passives && s.passives.rounds[round];
    if (passive && passive.length) out.push('Passive rules:', ...passive.map(t => '  ' + t));
    const scored = scoredBy(report, round, side);
    if (scored.length) out.push('Scored by:', ...scored);
    const lines = report.log.filter(e => e.round === round && (log || KEY_LINE.test(e.msg)));
    out.push(log ? 'Log:' : 'Key log lines:');
    lines.forEach(e => out.push(`  [${e.phase || ''}] ${e.msg}`));
  });
  out.push('', 'Damage leaders:');
  s.leaderboard.damage.filter(x => x.dealt > 0).forEach(x => out.push(`  ${side(x.player)} ${x.name}: ${x.dealt} damage, ${x.kills} kills, ${x.rp} RP, ${x.perRp == null ? '-' : x.perRp.toFixed(2)}/RP${x.alive ? '' : ' (destroyed)'}${x.seized ? ` (${SEIZED_WORDS[x.seized]})` : ''}`));
  // What a unit took off its own side: kept out of the damage above (summarize.cjs).
  if (s.leaderboard.friendly.length) {
    out.push('Friendly fire (HP and units a unit took off its own side):');
    s.leaderboard.friendly.forEach(x => out.push(`  ${side(x.player)} ${x.name}: ${x.friendly == null ? '?' : x.friendly} HP${x.friendlyKills.length ? `, destroyed ${x.friendlyKills.map(k => k.name).join(', ')}` : ''}`));
  }
  // What a unit's own rules took from it - a cost it paid, not friendly fire.
  if (s.leaderboard.costs.length) {
    out.push('Costs paid (HP a unit\'s own rules took from it):');
    s.leaderboard.costs.forEach(x => out.push(`  ${side(x.player)} ${x.name}: ${x.cost} HP`));
  }
  if (s.scoring.recorded) {
    out.push('VP contributed (fair share; objective VP that hinged on it):');
    s.scoring.byVp.filter(x => x.total > 0.05 || x.pivotal > 0).forEach(x => out.push(`  ${side(x.player)} ${x.name}: ${x.total.toFixed(1)} VP`
      + ` (obj ${x.objectives.toFixed(1)}, primary ${x.primary.toFixed(1)}, missions ${x.missions.toFixed(1)}), hinged ${x.pivotal}, ${x.perRp == null ? '-' : x.perRp.toFixed(1)}/100 RP`
      + `${x.seized ? ` (${SEIZED_WORDS[x.seized]})` : ''}`));
    [0, 1].forEach(p => {
      const u = s.scoring.unassigned[p];
      if (u.objectives + u.primary + u.missions > 0.05) out.push(`  ${side(p)} no unit: obj ${u.objectives}, primary ${u.primary}, missions ${u.missions}`);
    });
  }
  if (s.activity.recorded) {
    out.push('Activity (inaction score; advanced, nothing else; actions: movement/advance/ranged/melee/ability/magic/objective held):');
    s.activity.byInaction.filter(x => !x.isHQ).forEach(x => out.push(`  ${side(x.player)} ${x.name}: inaction ${x.inaction} (${x.idle} idle, ${x.idleMoved} after moving, ${x.overwatch} Overwatch)`
      + `; advanced only ${x.advanceOnly}${x.advanceOnlyRounds.length ? ' (R' + x.advanceOnlyRounds.join(', R') + ')' : ''}`
      + `; actions ${x.movement}/${x.advance}/${x.ranged}/${x.melee}/${x.ability}/${x.magic}/${x.objective}${x.seized ? ` (${SEIZED_WORDS[x.seized]})` : ''}`));
  }
  out.push(`Moves undone (the next move took the unit back beside its start, or away from the objective it had moved toward): ${s.tempo.entries.length}`);
  s.tempo.byUndone.forEach(x => out.push(`  ${side(x.player)} ${x.name}: ${x.undone} of ${x.moves} moves (${x.back} back, ${x.objective} away from an objective), ${x.squares} squares lost`));
  out.push('Secondary missions:');
  s.missions.forEach((list, p) => list.forEach(m => out.push(`  ${side(p)} ${m.name} (+${m.reward_vp} VP): kept R${m.keptRound}, ${m.outcome}${m.outcomeRound ? ' R' + m.outcomeRound : ''} - ${m.objective || ''}`)));
  return out.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--round');
  if (!target) throw new Error('usage: digest.cjs <name or folder> [--log]');
  const dir = fs.existsSync(target) ? path.resolve(target) : path.join(REPORTS_DIR, target);
  const file = fs.statSync(dir).isFile() ? dir : path.join(dir, 'report.json');
  const at = args.indexOf('--round');
  console.log(digest(JSON.parse(fs.readFileSync(file, 'utf8')), { log: args.includes('--log'), only: at >= 0 ? Number(args[at + 1]) : null }));
}

if (require.main === module) {
  try { main(); } catch (err) { console.error(err.stack || err.message); process.exit(1); }
}

module.exports = { digest };
