// Per batch: which army leans on shooting (its share of ranged damage over the batch); its record by map.
const fs = require('fs'), path = require('path');
const out = {}; const perArmy = {};
fs.readdirSync('reports').forEach(d => {
  const bf = path.join('reports', d, 'batch.json'); if (!fs.existsSync(bf)) return;
  const b = JSON.parse(fs.readFileSync(bf));
  const games = b.games.map((g, i) => { const f = path.join('reports', d, 'games', `game-${i + 1}.json`); return fs.existsSync(f) ? { g, r: JSON.parse(fs.readFileSync(f)) } : null; }).filter(Boolean);
  if (games.length < 4) return;
  // army index a -> player per game: swapped games put army 0 on player 1
  const dmg = [{ r: 0, m: 0 }, { r: 0, m: 0 }];
  games.forEach(({ g, r }) => (r.combats || []).forEach(c => {
    const p = (c.attacker || {}).player; if (p == null) return;
    const army = g.swapped ? 1 - p : p;
    const lost = (c.losses || []).reduce((s, l) => s + (l.player !== p ? l.lost : 0), 0);
    if (c.kind === 'ranged' || c.kind === 'overwatch') dmg[army].r += lost; else if (c.kind === 'melee') dmg[army].m += lost;
  }));
  const share = dmg.map(x => x.r / Math.max(1, x.r + x.m));
  if (Math.abs(share[0] - share[1]) < 0.15) return;   // no clear shooter
  const shooter = share[0] > share[1] ? 0 : 1;
  games.forEach(({ g }) => {
    const m = out[g.map] = out[g.map] || { n: 0, wins: 0, vpDiff: 0 };
    const winnerArmy = g.winner == null ? null : (g.swapped ? 1 - g.winner : g.winner);
    m.n++; if (winnerArmy === shooter) m.wins++;
    const vp = g.swapped ? [g.vp[1], g.vp[0]] : g.vp;
    m.vpDiff += vp[shooter] - vp[1 - shooter];
  });
  perArmy[d] = { shooter: b.armies[shooter].name, share: share.map(s => s.toFixed(2)) };
});
console.log('batches with a clear shooting army:', Object.keys(perArmy).length);
Object.entries(out).forEach(([k, m]) => console.log(`${k}: shooting army won ${m.wins}/${m.n} (${(100 * m.wins / m.n).toFixed(0)}%), VP margin ${(m.vpDiff / m.n).toFixed(1)}`));
console.log(perArmy);
