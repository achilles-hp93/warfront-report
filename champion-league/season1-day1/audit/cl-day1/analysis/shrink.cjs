'use strict';
// Shrunk (empirical-Bayes) excess VP per copy per battle, by unit type, and its RP equivalent.
const d = require('./data.json');
const U = d.units.filter(u => !u.isHQ);
const MODE = process.argv[2] || 'vp';
{ const rate = U.reduce((t, u) => t + u.vp, 0) / U.reduce((t, u) => t + u.rp * u.boardRounds, 0);
  const R = {}; d.battles.forEach(b => { R[b.id] = b.round; });
  U.forEach(u => { u.denial = u.killDetail.reduce((t, k) => t + k.rp * rate * Math.max(0, R[u.battle] - k.round + 1), 0); u.vpOnly = u.vp; if (MODE === 'value') u.vp = u.vp + u.denial; }); }
const dmgOf = u => Object.values(u.dmgByKind).reduce((t, x) => t + x, 0);
const RATE = U.reduce((t, u) => t + u.vp, 0) / U.reduce((t, u) => t + u.rp, 0);
const T = {};
U.forEach(u => { (T[u.tid] = T[u.tid] || []).push(u); });
const types = Object.values(T).map(L => {
  const e = L.map(u => u.vp - RATE * u.rp);
  const m = e.reduce((a, b) => a + b, 0) / e.length;
  const v = e.length > 1 ? e.reduce((a, b) => a + (b - m) ** 2, 0) / (e.length - 1) : null;
  return { L, n: L.length, m, v, u0: L[0] };
});
const multi = types.filter(t => t.n > 1);
const sw2 = multi.reduce((a, t) => a + t.v * (t.n - 1), 0) / multi.reduce((a, t) => a + t.n - 1, 0);
const grand = U.reduce((t, u) => t + (u.vp - RATE * u.rp), 0) / U.length; // ~0
const varMeans = types.reduce((a, t) => a + (t.m - grand) ** 2, 0) / (types.length - 1);
const tau2 = Math.max(0.01, varMeans - types.reduce((a, t) => a + sw2 / t.n, 0) / types.length);
console.log(`RATE ${(RATE * 100).toFixed(2)} VP/100RP; within-type SD ${Math.sqrt(sw2).toFixed(2)} VP; between-type SD ${Math.sqrt(tau2).toFixed(2)} VP; types ${types.length}`);
types.forEach(t => { t.B = tau2 / (tau2 + sw2 / t.n); t.shr = grand + t.B * (t.m - grand); t.se = Math.sqrt(sw2 / t.n); });
const line = t => {
  const L = t.L, u = t.u0, rp = L.reduce((a, x) => a + x.rp, 0) / t.n;
  return `| ${u.type} | ${u.faction.replace(/_/g, ' ').replace(/\b(of|the)\b/g, '').split(' ').filter(Boolean).slice(0, 2).join(' ')} | ${t.n} | ${rp.toFixed(0)} | ${u.oc} | ${(L.reduce((a, x) => a + x.vp, 0) / t.n).toFixed(1)} | ${(L.reduce((a, x) => a + x.vp, 0) * 100 / (rp * t.n)).toFixed(1)} | ${t.m >= 0 ? '+' : ''}${t.m.toFixed(1)} ±${t.se.toFixed(1)} | ${t.shr >= 0 ? '+' : ''}${t.shr.toFixed(1)} | ${(t.shr / RATE).toFixed(0)} | ${(L.reduce((a, x) => a + dmgOf(x), 0) * 100 / (rp * t.n)).toFixed(0)} | ${(L.reduce((a, x) => a + x.killRp, 0) / t.n).toFixed(0)} | ${(L.reduce((a, x) => a + x.taken, 0) / t.n).toFixed(1)}/${u.hp} | ${Math.round(100 * L.filter(x => x.alive).length / t.n)}% | ${(L.reduce((a, x) => a + x.pivotal, 0) / t.n).toFixed(1)} | ${(L.reduce((a, x) => a + x.idle, 0) / t.n).toFixed(1)} | ${L.filter(x => d.battles.find(b => b.id === x.battle).winner === x.player).length}/${t.n} | ${[...new Set(L.map(x => x.battle))].join(' ')} |`;
};
const H = '| unit | faction | n | RP | OC | VP/copy | VP/100RP | excess VP/copy (raw ±se) | shrunk excess | RP-equivalent | dmg/100RP | RP killed/copy | taken/HP | surv | hinged | idle | W | battles |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
const sorted = types.slice().sort((a, b) => b.shr - a.shr);
console.log('\n### Over-performers (top 20 by shrunk excess)\n' + H); sorted.slice(0, 20).forEach(t => console.log(line(t)));
console.log('\n### Under-performers (bottom 25 by shrunk excess)\n' + H); sorted.slice(-25).reverse().forEach(t => console.log(line(t)));
console.log('\n### Every type (by shrunk excess)\n' + H); sorted.forEach(t => console.log(line(t)));
