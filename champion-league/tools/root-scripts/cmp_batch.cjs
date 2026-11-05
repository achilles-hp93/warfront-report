const fs = require('fs'); const path = require('path');
const { summarize } = require('/home/user/warfront/scripts/battle_report/summarize.cjs');
for (const dir of process.argv.slice(2)) {
  const games = fs.readdirSync(path.join(dir, 'games')).filter(f => /^game-\d+\.json$/.test(f)).sort();
  const agg = { iron_imperium: {}, covenant_of_new_jerusalem: {} };
  const add = (f, k, v) => { agg[f][k] = (agg[f][k] || 0) + (v || 0); };
  console.log('==', dir.split('/').slice(-3).join('/'));
  for (const g of games) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'games', g)));
    const s = summarize(r);
    const parts = [g, 'R' + s.result.round, s.result.vp.join('-')];
    s.armies.forEach((a, p) => {
      const f = a.faction;
      let src = { objectives: 0, primary: 0, missions: 0, other: 0 }, cpG = 0, cpS = 0;
      s.economy.forEach(rd => { const pl = rd.players[p]; Object.keys(src).forEach(k => src[k] += pl.vp[k] || 0); cpG += pl.cp.gained; cpS += pl.cp.spent; });
      Object.keys(src).forEach(k => add(f, k, src[k]));
      add(f, 'cpGained', cpG); add(f, 'cpSpent', cpS); add(f, 'lostRp', a.lostRp); add(f, 'lostUnits', a.lostUnits);
      const prim = s.primary.find(x => x.player === p);
      parts.push(f.slice(0, 5) + ':' + (prim ? prim.card.id + '=' + prim.card.vp : '-') + ' obj' + src.objectives + ' pri' + src.primary + ' mis' + src.missions + ' lost' + a.lostRp);
    });
    console.log(parts.join('  '));
  }
  console.log(JSON.stringify(agg));
}
