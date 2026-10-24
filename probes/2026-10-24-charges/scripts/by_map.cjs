// Melee vs ranged by map, from every batch game under reports/ with a batch.json.
const fs = require('fs'), path = require('path');
const root = 'reports';
const M = {};
fs.readdirSync(root).forEach(d => {
  const bf = path.join(root, d, 'batch.json'); if (!fs.existsSync(bf)) return;
  const b = JSON.parse(fs.readFileSync(bf));
  b.games.forEach((g, i) => {
    const gf = path.join(root, d, 'games', `game-${i + 1}.json`); if (!fs.existsSync(gf)) return;
    const r = JSON.parse(fs.readFileSync(gf));
    const m = M[g.map] = M[g.map] || { games: 0, ranged: 0, melee: 0, rDmg: 0, mDmg: 0, charges: 0, rounds: 0, batches: new Set() };
    m.games++; m.rounds += g.round || 0; m.batches.add(d);
    (r.combats || []).forEach(c => {
      const k = c.kind; const dmg = (c.losses || []).reduce((s, l) => s + (l.player !== (c.attacker || {}).player ? l.lost : 0), 0);
      if (k === 'ranged' || k === 'overwatch') { m.ranged++; m.rDmg += dmg; }
      else if (k === 'melee') { m.melee++; m.mDmg += dmg; }
    });
    m.charges += (r.moves || []).filter(x => x.charged).length;
  });
});
console.log('map: games rounds | attacks ranged/melee | dmg ranged/melee (melee share) | charges/game');
Object.entries(M).forEach(([k, m]) => console.log(`${k}: ${m.games} games ${m.rounds} rds | ${m.ranged}/${m.melee} | ${m.rDmg}/${m.mDmg} (${(100 * m.mDmg / (m.rDmg + m.mDmg)).toFixed(0)}% melee) | ${(m.charges / m.games).toFixed(1)} charges, batches ${m.batches.size}`));
