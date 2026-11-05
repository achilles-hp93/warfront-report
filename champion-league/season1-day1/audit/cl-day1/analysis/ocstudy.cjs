'use strict';
const d = require('./data.json');
const units = d.units.filter(u => !u.isHQ);
const dmgOf = u => Object.values(u.dmgByKind).reduce((t, x) => t + x, 0);
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);
// least squares via normal equations
function ols(X, y) {
  const k = X[0].length;
  const A = Array.from({ length: k }, () => Array(k).fill(0)), b = Array(k).fill(0);
  X.forEach((row, i) => { for (let p = 0; p < k; p++) { b[p] += row[p] * y[i]; for (let q = 0; q < k; q++) A[p][q] += row[p] * row[q]; } });
  // gaussian elimination
  for (let c = 0; c < k; c++) {
    let piv = c; for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]]; [b[c], b[piv]] = [b[piv], b[c]];
    for (let r = 0; r < k; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let q = c; q < k; q++) A[r][q] -= f * A[c][q]; b[r] -= f * b[c]; }
  }
  const beta = b.map((v, i) => v / A[i][i]);
  const yhat = X.map(r => r.reduce((t, x, i) => t + x * beta[i], 0));
  const my = y.reduce((t, v) => t + v, 0) / y.length;
  const r2 = 1 - y.reduce((t, v, i) => t + (v - yhat[i]) ** 2, 0) / y.reduce((t, v) => t + (v - my) ** 2, 0);
  return { beta, r2 };
}
const U = units.filter(u => !u.arrived);
const fmt = (o, names) => names.map((n, i) => `${n} ${o.beta[i].toFixed(3)}`).join(', ') + `; R2 ${o.r2.toFixed(2)}`;
// 1. What earns VP (per copy per battle)
let X = U.map(u => [1, u.oc, dmgOf(u), u.hp, u.character ? 1 : 0]);
console.log('VP ~', fmt(ols(X, U.map(u => u.vp)), ['const', 'OC', 'dmg dealt', 'HP', 'CHARACTER']));
X = U.map(u => [1, u.oc, u.hp, u.meleeW, u.rangedW, u.character ? 1 : 0]);
console.log('VP ~', fmt(ols(X, U.map(u => u.vp)), ['const', 'OC', 'HP', 'meleeW', 'rangedW', 'CHARACTER']));
console.log('objVP ~', fmt(ols(X, U.map(u => u.vpObj)), ['const', 'OC', 'HP', 'meleeW', 'rangedW', 'CHARACTER']));
// 2. What RP charges for (template base RP; one row per template)
const T = {}; U.forEach(u => { T[u.tid] = u; });
const TL = Object.values(T);
X = TL.map(u => [1, u.oc, u.hp, u.meleeW, u.rangedW, u.character ? 1 : 0]);
console.log('baseRP ~', fmt(ols(X, TL.map(u => u.baseRp)), ['const', 'OC', 'HP', 'meleeW', 'rangedW', 'CHARACTER']), 'templates', TL.length);
// 3. side OC bins
const S = [];
d.battles.forEach(b => b.sides.forEach((s, p) => { const us = U.filter(u => u.battle === b.id && u.player === p); S.push({ b, p, win: b.winner === p, oc: sum(us, u => u.oc), models: sum(us, u => u.models), n: us.length, obj: s.vpSrc.objectives, vp: b.vp[p], name: s.name }); }));
const bins = [[0, 25], [25, 40], [40, 50], [50, 100]];
bins.forEach(([lo, hi]) => { const L = S.filter(x => x.oc >= lo && x.oc < hi); console.log(`side OC ${lo}-${hi}: ${L.length} sides, W ${L.filter(x => x.win).length}, objVP ${(sum(L, x => x.obj) / L.length).toFixed(1)}, VP ${(sum(L, x => x.vp) / L.length).toFixed(1)}: ${L.map(x => x.name + (x.win ? '*' : '')).join(', ')}`); });
[[0, 25], [25, 35], [35, 45], [45, 100]].forEach(([lo, hi]) => { const L = S.filter(x => x.models >= lo && x.models < hi); console.log(`side models ${lo}-${hi}: ${L.length} sides, W ${L.filter(x => x.win).length}, objVP ${(sum(L, x => x.obj) / L.length).toFixed(1)}`); });
// OC differential per battle vs objective VP differential
const diffs = d.battles.map(b => { const a = S.find(x => x.b === b && x.p === 0), c = S.find(x => x.b === b && x.p === 1); return { doc: a.oc - c.oc, dobj: a.obj - c.obj, dvp: a.vp - c.vp }; });
const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
const corr = (xs, ys) => { const mx = mean(xs), my = mean(ys); let n = 0, p = 0, q = 0; xs.forEach((x, i) => { n += (x - mx) * (ys[i] - my); p += (x - mx) ** 2; q += (ys[i] - my) ** 2; }); return n / Math.sqrt(p * q); };
console.log('battle OC diff vs obj VP diff r', corr(diffs.map(x => x.doc), diffs.map(x => x.dobj)).toFixed(2), 'vs VP diff r', corr(diffs.map(x => x.doc), diffs.map(x => x.dvp)).toFixed(2));
// objective VP per OC-round on board and per round on objective, by tier
const tierOf = u => { const t = u.tags || []; for (const k of ['EPIC HERO', 'EPIC', 'ELITE', 'SPECIALIST', 'STANDARD']) if (t.includes(k)) return (k === 'EPIC HERO' ? 'EPIC' : k) + (u.character ? ' char' : ''); return 'other'; };
const G = {}; U.forEach(u => { (G[tierOf(u)] = G[tierOf(u)] || []).push(u); });
Object.entries(G).forEach(([k, L]) => console.log(k.padEnd(18), 'n', L.length, 'objVP per round on objective', (sum(L, u => u.vpObj) / sum(L, u => u.onObjRounds)).toFixed(2), 'rounds on obj per copy', (sum(L, u => u.onObjRounds) / L.length).toFixed(2), 'OC per model', (sum(L, u => u.oc) / sum(L, u => u.models)).toFixed(2), 'RP per model', (sum(L, u => u.rp) / sum(L, u => u.models)).toFixed(1), 'RP per OC', (sum(L, u => u.rp) / Math.max(1, sum(L, u => u.oc))).toFixed(1)));
