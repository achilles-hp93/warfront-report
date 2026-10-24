const fs = require('fs');
const files = process.argv.slice(2);
const f2 = v => v == null ? '-' : (Math.round(v * 100) / 100).toFixed(2);
files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(file));
  console.log('==', file, 'result', JSON.stringify(d.result && d.result.vp));
  d.probe.rows.filter(r => r.type === 'charge').forEach(r => {
    const c = r.charge;
    const shot = r.shotWalk.worth > r.shotHere.worth ? r.shotWalk : r.shotHere;
    const chargeWorth = c.P * c.dealt * c.tval;
    const flag = shot.worth > 1.2 * chargeWorth ? ' <-- SHOT WORTH MORE' : '';
    console.log(`R${r.round} ${r.name} -> ${c.target} P${f2(c.P)} dealt ${f2(c.dealt)} taken ${f2(c.taken)} deny ${f2(c.deny)} losing ${f2(c.losing)} rngOnT ${f2(c.rangedOnTarget)} mf ${c.meleeFocused} cont ${c.contests} | score ${f2(c.score)} floor ${f2(r.floor)} (dest ${f2(c.dest)} stay ${f2(c.stay)} walk ${f2(r.walkDest)}) | best shot ${f2(shot.hp)}hp on ${shot.target} worth ${f2(shot.worth)} vs charge worth ${f2(chargeWorth)} (tval ${f2(c.tval)})${flag}`);
  });
});
