'use strict';
// The per-type table for balance.md: both lenses (Shapley VP; VP + kill denial), shrunk.
const d = require('./data.json');
const U = d.units.filter(u => !u.isHQ);
const R = {}; d.battles.forEach(b => { R[b.id] = b; });
const dmgOf = u => Object.values(u.dmgByKind).reduce((t, x) => t + x, 0);
const perRound = U.reduce((t, u) => t + u.vp, 0) / U.reduce((t, u) => t + u.rp * u.boardRounds, 0);
U.forEach(u => { u.denial = u.killDetail.reduce((t, k) => t + k.rp * perRound * Math.max(0, R[u.battle].round - k.round + 1), 0); u.value = u.vp + u.denial; });
function lens(key) {
  const rate = U.reduce((t, u) => t + u[key], 0) / U.reduce((t, u) => t + u.rp, 0);
  const T = {}; U.forEach(u => { (T[u.tid] = T[u.tid] || []).push(u); });
  const types = Object.entries(T).map(([tid, L]) => {
    const e = L.map(u => u[key] - rate * u.rp); const m = e.reduce((a, b) => a + b, 0) / e.length;
    return { tid, n: L.length, m, v: L.length > 1 ? e.reduce((a, b) => a + (b - m) ** 2, 0) / (L.length - 1) : null };
  });
  const multi = types.filter(t => t.n > 1);
  const sw2 = multi.reduce((a, t) => a + t.v * (t.n - 1), 0) / multi.reduce((a, t) => a + t.n - 1, 0);
  const varMeans = types.reduce((a, t) => a + t.m ** 2, 0) / (types.length - 1);
  const tau2 = Math.max(0.01, varMeans - types.reduce((a, t) => a + sw2 / t.n, 0) / types.length);
  const out = {}; types.forEach(t => { out[t.tid] = { shr: (tau2 / (tau2 + sw2 / t.n)) * t.m, raw: t.m, rate }; });
  return { out, rate, sw2, tau2 };
}
const A = lens('vp'), B = lens('value');
const T = {}; U.forEach(u => { (T[u.tid] = T[u.tid] || []).push(u); });
const short = f => f.replace(/_/g, ' ').replace(/\b(of|the|new|two)\b/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
const rows = Object.entries(T).map(([tid, L]) => {
  const n = L.length, u = L[0], rp = L.reduce((t, x) => t + x.rp, 0) / n;
  const avg = f => L.reduce((t, x) => t + f(x), 0) / n;
  return { tid, n, u, rp, a: A.out[tid], b: B.out[tid], vp: avg(x => x.vp), obj: avg(x => x.vpObj), piv: avg(x => x.pivotal), value: avg(x => x.value),
    dmg: avg(dmgOf), kill: avg(x => x.killRp), taken: avg(x => x.taken), surv: L.filter(x => x.alive).length / n, idle: avg(x => x.idle), onObj: avg(x => x.onObjRounds),
    w: L.filter(x => R[x.battle].winner === x.player).length, battles: [...new Set(L.map(x => x.battle))].join(' '), arrived: L.filter(x => x.arrived).length };
});
rows.sort((x, y) => y.a.shr - x.a.shr);
const sg = x => (x >= 0 ? '+' : '') + x.toFixed(0);
console.log(`Par: ${(A.rate * 100).toFixed(2)} VP per 100 RP (Shapley VP); ${(B.rate * 100).toFixed(2)} per 100 RP (VP + kill denial, ${(perRound * 100).toFixed(2)} VP per 100 RP per Battle Round on the board). Shrinkage: within-type SD ${Math.sqrt(A.sw2).toFixed(2)} VP, between-type SD ${Math.sqrt(A.tau2).toFixed(2)} VP.`);
console.log('');
console.log('| unit | faction | n | RP | OC | VP/copy | VP/100RP | obj VP | hinged | RP-eq (VP) | value/copy | RP-eq (value) | dmg/copy | dmg/100RP | RP killed | taken/HP | surv | idle | rds on obj | W | battles |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
rows.forEach(r => console.log(`| ${r.u.type}${r.u.character ? ' (C)' : ''} | ${short(r.u.faction)} | ${r.n}${r.arrived ? ` (${r.arrived}a)` : ''} | ${r.rp.toFixed(0)} | ${r.u.oc}${r.u.ocSplit ? '/0' : ''} | ${r.vp.toFixed(1)} | ${(r.vp * 100 / r.rp).toFixed(1)} | ${r.obj.toFixed(1)} | ${r.piv.toFixed(1)} | ${sg(r.a.shr / A.rate)} | ${r.value.toFixed(1)} | ${sg(r.b.shr / B.rate)} | ${r.dmg.toFixed(1)} | ${(r.dmg * 100 / r.rp).toFixed(0)} | ${r.kill.toFixed(0)} | ${r.taken.toFixed(1)}/${r.u.hp} | ${Math.round(r.surv * 100)}% | ${r.idle.toFixed(1)} | ${r.onObj.toFixed(1)} | ${r.w}/${r.n} | ${r.battles} |`));
