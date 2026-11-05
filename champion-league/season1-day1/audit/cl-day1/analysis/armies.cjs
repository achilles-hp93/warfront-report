'use strict';
// Unit-by-unit lines for the named armies (or all with --all).
const d = require('./data.json');
const want = process.argv.slice(2);
const all = want.includes('--all');
d.battles.forEach(b => b.sides.forEach((s, p) => {
  if (!all && !want.some(w => s.name.includes(w))) return;
  const us = d.units.filter(u => u.battle === b.id && u.player === p && !u.isHQ);
  console.log(`\n${b.id} ${s.name} ${b.winner === p ? 'WON' : 'lost'} ${b.vp[p]}-${b.vp[1 - p]} obj/prim/mis ${s.vpSrc.objectives}/${s.vpSrc.primary}/${s.vpSrc.missions} lostRp ${s.lostRp} vs ${b.sides[1 - p].name} (lostRp ${b.sides[1 - p].lostRp}); objective VP by round ${s.objByRound.join(',')} vs ${b.sides[1 - p].objByRound.join(',')}`);
  us.forEach(u => {
    const dmg = Object.values(u.dmgByKind).reduce((a, x) => a + x, 0);
    const tags = (u.tags || []).filter(t => /ELITE|STANDARD|EPIC|SPECIALIST|TOUGH|MOUNTED|VEHICLE|MONSTER|FLY|CHARACTER/.test(t)).join(',');
    console.log(`  ${u.name.padEnd(34)} ${String(u.rp).padStart(3)}RP OC${String(u.oc).padStart(3)} m${String(u.models).padStart(2)} hp${String(u.hp).padStart(3)} DEF${u.def}+ ${tags.padEnd(30)} vp ${u.vp.toFixed(1).padStart(4)} obj ${u.vpObj.toFixed(1)} hinge ${u.pivotal} dmg ${dmg} (${Object.entries(u.dmgByKind).map(([k, v]) => k[0] + v).join(' ')}) killRp ${u.killRp} taken ${u.taken} ${u.alive ? 'alive' : 'DEAD'} idle ${u.idle} onObj ${u.onObjRounds}/${u.boardRounds}${u.arrived ? ' (arrived)' : ''}${u.leads ? ' led by ' + u.leads : ''}`);
  });
}));
