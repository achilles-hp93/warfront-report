// Per army over a batch: damage by attack kind, and each unit type's attacks/idle rounds.
const fs = require('fs'); const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f => /^game-\d+\.json$/.test(f));
const army = {}, types = {};
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(dir + '/' + f));
  const names = r.meta.armyNames;
  const uname = {}; (r.units || []).forEach(u => uname[u.uid] = { name: u.name.replace(/ \d+$/, ''), p: u.player });
  (r.meta.armies || []).flat().forEach(u => uname[u.uid] = uname[u.uid] || { name: u.name.replace(/ \d+$/, ''), p: u.player });
  for (const c of r.combats || []) {
    const p = c.attacker && c.attacker.player; if (p == null) continue;
    const a = names[p]; army[a] = army[a] || {};
    const k = c.kind + (c.label ? ':' + c.label : '');
    const dmgEnemy = (c.losses || []).filter(l => l.player !== p).reduce((s, l) => s + l.lost, 0);
    const dmgOwn = (c.losses || []).filter(l => l.player === p).reduce((s, l) => s + l.lost, 0);
    army[a][c.kind] = army[a][c.kind] || { attacks: 0, dmg: 0, own: 0 };
    army[a][c.kind].attacks++; army[a][c.kind].dmg += dmgEnemy; army[a][c.kind].own += dmgOwn;
    const t = names[p] + ' / ' + (uname[c.attacker.uid] || { name: c.attacker.name }).name;
    types[t] = types[t] || { ranged: 0, melee: 0, other: 0, dmg: 0, idle: 0 };
    types[t][c.kind === 'ranged' ? 'ranged' : c.kind === 'melee' ? 'melee' : 'other']++; types[t].dmg += dmgEnemy;
  }
  for (const a of r.activity || []) {
    if (a.kind !== 'idle') continue; const u = uname[a.uid]; if (!u) continue;
    const t = names[u.p] + ' / ' + u.name; types[t] = types[t] || { ranged: 0, melee: 0, other: 0, dmg: 0, idle: 0 }; types[t].idle++;
  }
}
console.log(files.length + ' battles'); console.log(JSON.stringify(army, null, 1));
Object.keys(types).sort().forEach(t => console.log(t.padEnd(52), JSON.stringify(types[t])));
