const fs = require('fs'); const path = require('path');
const { summarize } = require('/home/user/warfront/scripts/battle_report/summarize.cjs');
const want = process.argv[3] || 'jade_mandate';
for (const dir of process.argv[2].split(',')) {
  const games = fs.readdirSync(path.join(dir, 'games')).filter(f => /^game-\d+\.json$/.test(f));
  const by = {};
  for (const g of games) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'games', g)));
    const s = summarize(r); const facs = s.armies.map(a => a.faction);
    ((s.passives || {}).attacks || []).forEach(p => {
      if (facs[p.player] !== want) return;
      const t = by[p.name] || (by[p.name] = { attacks: 0, added: 0, prevented: 0 });
      t.attacks += p.attacks; t.added += p.added || 0; t.prevented += p.prevented || 0;
    });
  }
  console.log('==', dir.split('/').slice(-3).join('/'));
  Object.entries(by).sort((a, b) => (b[1].added + b[1].prevented) - (a[1].added + a[1].prevented)).forEach(([k, t]) =>
    console.log(k.padEnd(28), 'attacks/game', (t.attacks / games.length).toFixed(1), 'added/game', (t.added / games.length).toFixed(2), 'kept off/game', (t.prevented / games.length).toFixed(2)));
}
