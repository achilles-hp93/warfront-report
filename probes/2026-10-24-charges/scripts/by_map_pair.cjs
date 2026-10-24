// Within each batch: melee share of damage and ranged damage per game, Triple Hills vs the other maps.
const fs = require('fs'), path = require('path');
const rows = [];
fs.readdirSync('reports').forEach(d => {
  const bf = path.join('reports', d, 'batch.json'); if (!fs.existsSync(bf)) return;
  const b = JSON.parse(fs.readFileSync(bf));
  const by = {};
  b.games.forEach((g, i) => {
    const f = path.join('reports', d, 'games', `game-${i + 1}.json`); if (!fs.existsSync(f)) return;
    const r = JSON.parse(fs.readFileSync(f));
    const k = g.map === 'TRIPLE HILLS' ? 'th' : 'other';
    const x = by[k] = by[k] || { n: 0, r: 0, m: 0 };
    x.n++;
    (r.combats || []).forEach(c => {
      const p = (c.attacker || {}).player;
      const lost = (c.losses || []).reduce((s, l) => s + (l.player !== p ? l.lost : 0), 0);
      if (c.kind === 'ranged' || c.kind === 'overwatch') x.r += lost; else if (c.kind === 'melee') x.m += lost;
    });
  });
  if (!by.th || !by.other) return;
  rows.push({ d, armies: b.armies.map(a => a.name).join(' v '), th: by.th, other: by.other });
});
let up = 0;
rows.forEach(x => {
  const s = v => v.m / Math.max(1, v.m + v.r);
  if (s(x.th) > s(x.other)) up++;
  console.log(`${x.d.padEnd(30)} melee share TH ${(100 * s(x.th)).toFixed(0)}% (${x.th.n}g) vs other ${(100 * s(x.other)).toFixed(0)}% (${x.other.n}g); ranged/game ${(x.th.r / x.th.n).toFixed(0)} vs ${(x.other.r / x.other.n).toFixed(0)}`);
});
console.log(`TH melee share higher in ${up} of ${rows.length} batches`);
