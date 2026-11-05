// Per unit type over a batch: copies, survival, damage dealt/taken, VP - per copy and per 100 RP.
const fs = require('fs'); const path = require('path');
const { summarize } = require('/home/user/warfront/scripts/battle_report/summarize.cjs');
const want = process.argv[3] || 'jade_mandate';
for (const dir of process.argv[2].split(',')) {
  const games = fs.readdirSync(path.join(dir, 'games')).filter(f => /^game-\d+\.json$/.test(f));
  const by = {};
  let rpSide = [0, 0];
  for (const g of games) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'games', g)));
    const s = summarize(r);
    const facs = s.armies.map(a => a.faction);
    const score = {}; (s.scoring.rows || []).forEach(x => { score[x.uid] = x.total || 0; });
    s.leaderboard.rows.forEach(x => {
      if (x.isHQ) return;
      const side = facs[x.player] === want ? 'A' : 'B';
      const key = side + ' ' + facs[x.player].slice(0, 12) + ' | ' + x.name.replace(/ \d+$/, '');
      const t = by[key] || (by[key] = { n: 0, rp: 0, alive: 0, dealt: 0, taken: 0, kills: 0, vp: 0 });
      t.n++; t.rp += x.rp; t.alive += x.alive ? 1 : 0; t.dealt += x.dealt || 0; t.taken += x.taken || 0; t.kills += x.kills || 0; t.vp += score[x.uid] || 0;
    });
  }
  console.log('==', path.basename(dir), games.length, 'games');
  console.log('side | unit | RP | copies/game | alive% | dealt/copy | dealt/100RP | taken/copy | VP/copy | VP/100RP');
  Object.keys(by).sort().forEach(k => {
    const t = by[k]; const per = t.n;
    console.log([k, (t.rp / per).toFixed(0), (per / games.length).toFixed(1), (100 * t.alive / per).toFixed(0), (t.dealt / per).toFixed(1), (100 * t.dealt / t.rp).toFixed(1), (t.taken / per).toFixed(1), (t.vp / per).toFixed(2), (100 * t.vp / t.rp).toFixed(1)].join(' | '));
  });
}
