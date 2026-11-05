// Per unit type over a batch: copies, VP share per copy, damage dealt per copy, survival.
const fs = require('fs'), path = require('path');
const [root, name] = process.argv.slice(2);
const dir = path.join(root, name, 'games'); const rows = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
  const share = {}; (g.attribution || []).forEach(a => Object.entries(a.shares || {}).forEach(([u, v]) => share[u] = (share[u] || 0) + v));
  const dealt = {}; g.combats.forEach(c => { if (!c.attacker) return; (c.losses || []).forEach(l => { if (l.player !== c.attacker.player) dealt[c.attacker.uid] = (dealt[c.attacker.uid] || 0) + l.lost; }); });
  g.units.filter(u => !u.isHQ).forEach(u => {
    const k = g.meta.armyNames[u.player].slice(0, 12) + ' | ' + u.name.replace(/ \d+$/, '');
    const r = rows[k] || (rows[k] = { n: 0, vp: 0, dmg: 0, alive: 0, rp: u.rp });
    r.n++; r.vp += share[u.uid] || 0; r.dmg += dealt[u.uid] || 0; if (u.alive) r.alive++;
  });
}
Object.entries(rows).sort((a, b) => b[1].vp / b[1].n - a[1].vp / a[1].n).forEach(([k, r]) =>
  console.log(k.padEnd(52), 'copies', String(r.n).padStart(2), 'VP/copy', (r.vp / r.n).toFixed(1).padStart(5), 'dmg/copy', (r.dmg / r.n).toFixed(1).padStart(5), 'alive', r.alive + '/' + r.n, 'RP', r.rp));
