'use strict';
const d = require('./data.json');
const U = d.units.filter(u => !u.isHQ && !u.character);
const dmgOf = u => Object.values(u.dmgByKind).reduce((t, x) => t + x, 0);
const T = {};
U.filter(u => (u.tags || []).some(t => ['ELITE', 'EPIC', 'SPECIALIST'].includes(t))).forEach(u => { (T[u.tid] = T[u.tid] || []).push(u); });
const rows = Object.values(T).map(L => {
  const u = L[0], n = L.length, rp = L.reduce((t, x) => t + x.rp, 0);
  return { u, n, rp: rp / n, ocm: u.oc / u.models, vp100: L.reduce((t, x) => t + x.vp, 0) * 100 / rp, dmg100: L.reduce((t, x) => t + dmgOf(x), 0) * 100 / rp,
    kill100: L.reduce((t, x) => t + x.killRp, 0) * 100 / rp, takenHp: L.reduce((t, x) => t + x.taken, 0) / (n * u.hp), surv: L.filter(x => x.alive).length / n,
    tier: (u.tags || []).find(t => ['EPIC', 'ELITE', 'SPECIALIST'].includes(t)), tough: (u.tags || []).includes('TOUGH'), mounted: (u.tags || []).includes('MOUNTED') };
});
rows.sort((a, b) => a.vp100 - b.vp100);
console.log('| unit | tier | n | RP | models | OC (per model) | DEF | VP/100RP | dmg/100RP | RP killed/100RP | taken/HP | surv |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
rows.forEach(r => console.log(`| ${r.u.type} | ${r.tier}${r.tough ? ' TOUGH' : ''}${r.mounted ? ' MOUNTED' : ''} | ${r.n} | ${r.rp.toFixed(0)} | ${r.u.models} | ${r.u.oc} (${r.ocm.toFixed(1)}) | ${r.u.def}+ | ${r.vp100.toFixed(1)} | ${r.dmg100.toFixed(0)} | ${r.kill100.toFixed(0)} | ${r.takenHp.toFixed(2)} | ${Math.round(100 * r.surv)}% |`));
