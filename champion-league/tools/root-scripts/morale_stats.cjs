// Morale Tests per battle over batch folders: how many, how many failed, how many Rally Cry passes.
const fs = require('fs'); const path = require('path');
for (const dir of process.argv.slice(2)) {
  const gdir = path.join(dir, 'games');
  if (!fs.existsSync(gdir)) continue;
  const games = fs.readdirSync(gdir).filter(f => /^game-\d+\.json$/.test(f));
  let tests = 0, failed = 0, rally = 0, regroup = 0;
  for (const g of games) {
    const r = JSON.parse(fs.readFileSync(path.join(gdir, g)));
    (r.log || []).map(x => typeof x === 'string' ? x : (x.text || x.msg || '')).forEach(l => {
      if (!/ Morale Test( \(|\s-\s)/.test(l)) return;
      tests++;
      if (/RALLY CRY/.test(l)) rally++;
      else if (/FAILED/.test(l)) failed++;
    });
  }
  console.log(path.basename(dir).padEnd(20), 'games', games.length, '| tests/game', (tests / games.length).toFixed(1),
    '| failed', failed, `(${(100 * failed / Math.max(1, tests - rally)).toFixed(0)}% of rolled)`, '| Rally Cry', rally);
}
