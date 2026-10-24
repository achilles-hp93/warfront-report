// Losing-fight charges: dealt < half of taken. Did the charger survive to the next round? Was it for an objective?
const fs = require('fs');
const f2 = v => v == null ? '-' : (Math.round(v * 100) / 100).toFixed(2);
let n = 0, all = 0, died = 0, objective = 0;
process.argv.slice(2).forEach(file => {
  const d = JSON.parse(fs.readFileSync(file));
  const seen = {}; (d.activity || []).forEach(a => { seen[a.uid + ':' + a.round] = true; });
  const lastRound = Math.max(...(d.activity || []).map(a => a.round));
  Object.values(d.probe.offers || {}).filter(o => o.outcome === 'charge').forEach(o => {
    all++;
    const c = o.best; if (!(c.dealt < 0.5 * c.taken)) return;
    n++;
    const alive = o.round >= lastRound ? null : !!seen[o.uid + ':' + (o.round + 1)];
    if (alive === false) died++;
    const gain = c.dest - Math.max(o.walkDest == null ? -Infinity : o.walkDest, c.stay);
    if (gain > 0) objective++;
    console.log(`${file} R${o.round} ${o.name} -> ${c.target}: dealt ${f2(c.dealt)} taken ${f2(c.taken)} P${f2(c.P)} | landing ${f2(c.dest)} vs best of walk/stay ${f2(Math.max(o.walkDest == null ? -Infinity : o.walkDest, c.stay))} (gain ${f2(gain)}) | next round alive: ${alive}`);
  });
});
console.log({ charges: all, losingFights: n, gainedPosition: objective, diedBeforeNextRound: died });
