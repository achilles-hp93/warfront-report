const b = require(process.argv[2] + '/batch.json');
let n = b.games.length, s = { d: [0, 0], l: [0, 0], v: [0, 0], w: [0, 0], r: 0 };
b.games.forEach(g => { [0, 1].forEach(a => { s.d[a] += g.damage[a]; s.l[a] += g.lostRp[a]; s.v[a] += g.vp[a]; }); if (g.winner != null) s.w[g.winner]++; s.r += g.round; });
console.log(process.argv[2].split('/').slice(-3, -2)[0], b.armies.map(a => a.name).join(' vs '), '| wins', s.w.join('-'), '/', n,
  '| VP', s.v.map(x => (x / n).toFixed(1)).join('-'), '| dealt', s.d.map(x => (x / n).toFixed(0)).join('-'), '| RP lost', s.l.map(x => (x / n).toFixed(0)).join('-'), '| rounds', (s.r / n).toFixed(1));
