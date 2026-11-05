'use strict';
// RP destroyed and damage by attack kind and by the attacker's role; per-battle ranged vs melee shares.
const fs = require('fs'), path = require('path');
const { enrichCombats } = require('/home/user/warfront/scripts/battle_report/page/enrich.cjs');
const D = require('./data.json');
const R = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/battle_reports';
const uinfo = {}; D.units.forEach(u => { uinfo[u.battle + ':' + u.uid] = u; });
const role = u => !u ? 'none' : u.isHQ ? 'HQ' : u.character ? 'CHARACTER' : ((u.tags || []).some(t => ['VEHICLE', 'MACHINE', 'MONSTER', 'ARTILLERY'].includes(t)) ? 'big ' : '') + (u.rangedW > u.meleeW ? 'shooter' : 'melee');
const killRp = {}, dmg = {}, byRoleKind = {}, perBattle = [];
const victimRole = {};
fs.readdirSync(R).filter(d => d.startsWith('cl-s1-d1-d1-m')).sort().forEach(dir => {
  const id = dir.replace('cl-s1-d1-d1-m', 'M');
  const r = JSON.parse(fs.readFileSync(path.join(R, dir, 'report.json'), 'utf8'));
  enrichCombats(r);
  const rpOf = {}; r.meta.armies.flat().concat(r.units).forEach(u => { if (rpOf[u.uid] == null) rpOf[u.uid] = u.rp || 0; });
  const b = { id, ranged: 0, overwatch: 0, melee: 0, other: 0 };
  r.combats.forEach(c => {
    let kind = c.kind; if (kind === 'ranged' && c.phase === 'MOVEMENT') kind = 'overwatch';
    (c.losses || []).forEach(l => {
      if (l.player == null) return;
      let who = c.attacker, k = c.attacker ? kind : 'effect';
      if (who && who.player === l.player) { if (kind === 'melee' && c.target && c.target.player !== l.player) { who = c.target; k = 'melee'; } else return; }
      dmg[k] = (dmg[k] || 0) + (l.lost || 0);
      if (l.killed) killRp[k] = (killRp[k] || 0) + (rpOf[l.uid] || 0);
      const ro = role(who && uinfo[id + ':' + who.uid]);
      const key = ro + '|' + k;
      byRoleKind[key] = byRoleKind[key] || { dmg: 0, killRp: 0 };
      byRoleKind[key].dmg += l.lost || 0; if (l.killed) byRoleKind[key].killRp += rpOf[l.uid] || 0;
      if (b[k] != null) b[k] += l.lost || 0; else b.other += l.lost || 0;
      const vr = role(uinfo[id + ':' + l.uid]);
      victimRole[vr + '|' + k] = (victimRole[vr + '|' + k] || 0) + (l.lost || 0);
    });
  });
  perBattle.push(b);
});
console.log('damage by kind', dmg);
console.log('RP destroyed by kind', killRp);
console.log('by attacker role|kind', byRoleKind);
console.log('damage TAKEN by victim role|kind', victimRole);
console.log(perBattle.map(b => `${b.id} R${b.ranged} OW${b.overwatch} M${b.melee} O${b.other}`).join('\n'));
