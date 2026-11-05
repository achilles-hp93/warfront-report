'use strict';
const d = require('./data.json');
const units = d.units.filter(u => !u.isHQ);
const dmgOf = u => Object.values(u.dmgByKind).reduce((t, x) => t + x, 0);
const T = {};
units.forEach(u => { (T[u.type] = T[u.type] || []).push(u); });
const rows = Object.entries(T).map(([k, L]) => {
  const rp = L.reduce((t, u) => t + u.rp, 0), n = L.length;
  return { k, n, rp: rp / n, dmg: L.reduce((t, u) => t + dmgOf(u), 0) / n, killRp: L.reduce((t, u) => t + u.killRp, 0) / n,
    taken: L.reduce((t, u) => t + u.taken, 0) / n, hp: L[0].hp, def: L[0].def, surv: L.filter(u => u.alive).length / n,
    vp: L.reduce((t, u) => t + u.vp, 0) / n, tough: (L[0].tags || []).includes('TOUGH'), melee: L[0].meleeW, ranged: L[0].rangedW, role: L[0].character ? 'char' : (L[0].rangedW > L[0].meleeW ? 'ranged' : 'melee') };
});
rows.forEach(r => { r.killPer100 = r.killRp * 100 / r.rp; r.exch = r.killRp - (1 - r.surv) * r.rp; r.exchPer100 = r.exch * 100 / r.rp; });
const show = r => `${r.k.padEnd(36)} n${r.n} ${r.rp.toFixed(0).padStart(3)}RP ${r.role.padEnd(6)} DEF${r.def}+${r.tough ? 'T' : ' '} hp${String(r.hp).padStart(3)} dmg ${r.dmg.toFixed(1).padStart(5)} killRp ${r.killRp.toFixed(0).padStart(4)} (${r.killPer100.toFixed(0)}/100RP) taken ${r.taken.toFixed(1).padStart(5)} surv ${(r.surv * 100).toFixed(0)}% net RP exch ${r.exch.toFixed(0)} (${r.exchPer100.toFixed(0)}/100RP) VP ${r.vp.toFixed(1)}`;
console.log('By killed RP per 100 RP (all copies):');
rows.sort((a, b) => b.killPer100 - a.killPer100).slice(0, 25).forEach(r => console.log(show(r)));
console.log('\nBy net RP exchange per 100 RP, worst:');
rows.sort((a, b) => a.exchPer100 - b.exchPer100).slice(0, 20).forEach(r => console.log(show(r)));
console.log('\nTaken per HP lowest among ELITE/EPIC squads with HP>=9 (durability):');
rows.filter(r => r.role !== 'char').sort((a, b) => a.taken / a.hp - b.taken / b.hp).slice(0, 15).forEach(r => console.log(show(r)));
