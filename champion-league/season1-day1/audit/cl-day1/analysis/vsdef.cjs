'use strict';
// Damage per attack record by attack kind and target DEF; damage per action from the activity record.
const fs = require('fs'), path = require('path');
const { enrichCombats } = require('/home/user/warfront/scripts/battle_report/page/enrich.cjs');
const D = require('./data.json');
const R = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/battle_reports';
const info = {}; D.units.forEach(u => { info[u.battle + ':' + u.uid] = u; });
const G = {};
const rng = {};
fs.readdirSync(R).filter(d => d.startsWith('cl-s1-d1-d1-m')).sort().forEach(dir => {
  const id = dir.replace('cl-s1-d1-d1-m', 'M');
  const r = JSON.parse(fs.readFileSync(path.join(R, dir, 'report.json'), 'utf8'));
  enrichCombats(r);
  r.combats.forEach(c => {
    let kind = c.kind; if (kind === 'ranged' && c.phase === 'MOVEMENT') kind = 'overwatch';
    if (!['ranged', 'overwatch', 'melee'].includes(kind) || !c.attacker || !c.target) return;
    if (c.friendlyFire) return;
    const t = info[id + ':' + c.target.uid];
    if (!t) return;
    const def = t.isHQ ? 'HQ' : (t.def || 7) + '+' + ((t.tags || []).includes('TOUGH') ? 'T' : '');
    const dealt = (c.losses || []).filter(l => l.player !== c.attacker.player).reduce((s, l) => s + (l.lost || 0), 0);
    const back = (c.losses || []).filter(l => l.player === c.attacker.player).reduce((s, l) => s + (l.lost || 0), 0);
    const k = kind + '|' + def;
    G[k] = G[k] || { n: 0, dmg: 0, back: 0, zero: 0 };
    G[k].n++; G[k].dmg += dealt; G[k].back += back; if (!dealt) G[k].zero++;
  });
});
const defs = ['2+', '2+T', '3+', '3+T', '4+', '4+T', '5+', '5+T', '6+', 'HQ'];
for (const kind of ['ranged', 'overwatch', 'melee']) {
  console.log(kind);
  defs.forEach(dd => { const g = G[kind + '|' + dd]; if (g) console.log(`  vs DEF ${dd.padEnd(4)} n ${String(g.n).padStart(3)} dmg/record ${(g.dmg / g.n).toFixed(2)} zero-damage ${(100 * g.zero / g.n).toFixed(0)}%${kind === 'melee' ? ' struck back ' + (g.back / g.n).toFixed(2) : ''}`); });
}
// per action from activity
const units = D.units.filter(u => !u.isHQ);
const act = k => units.reduce((t, u) => t + (u.act[k] || 0), 0);
const dm = k => units.reduce((t, u) => t + (u.dmgByKind[k] || 0), 0);
console.log('actions: ranged', act('ranged'), 'melee', act('melee'), 'overwatch shots', units.reduce((t, u) => t + u.overwatchN, 0));
console.log('damage per ranged action', (dm('ranged') / act('ranged')).toFixed(2), 'per melee action (strikes + counterattacks)', (dm('melee') / act('melee')).toFixed(2), 'per overwatch shot', (dm('overwatch') / units.reduce((t, u) => t + u.overwatchN, 0)).toFixed(2));
