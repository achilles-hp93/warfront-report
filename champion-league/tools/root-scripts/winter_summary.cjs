// node winter_summary.cjs <reports dir> <batch names...>: Rurik's batches - wins, VP by source,
// losses, battle length, and how often the blizzard CHILLED an enemy, by round.
const fs = require('fs'); const path = require('path');
const dir = process.argv[2];
for (const name of process.argv.slice(3)) {
  const b = JSON.parse(fs.readFileSync(path.join(dir, name, 'batch.json'), 'utf8'));
  const g = b.games; const n = g.length;
  const avg = f => [0, 1].map(a => (g.reduce((s, x) => s + f(x, a), 0) / n).toFixed(1)).join(' / ');
  const wins = a => g.filter(x => x.winner === a).length;
  // Enemy units the storm catches: those standing in it at a round's end, under the
  // next round's reach, are CHILLED at that round's Command Phase end.
  let chilled = {}, chillTotal = 0;
  fs.readdirSync(path.join(dir, name, 'games')).filter(f => f.endsWith('.json')).forEach(f => {
    const r = JSON.parse(fs.readFileSync(path.join(dir, name, 'games', f), 'utf8'));
    const nv = r.meta.factions.indexOf('principality_of_novgorod');
    const rows = r.snaps[0].rows;
    const bottom = Math.min(...r.snaps[0].units.filter(u => u.player === nv).map(u => u.row)) > rows / 2;
    r.snaps.forEach(s => {
      const m = /^end of round (\d+)/.exec(s.label || ''); if (!m) return;
      const next = Number(m[1]) + 1, reach = Math.min(rows, 4 + 2 * (next - 1));
      const n = s.units.filter(u => u.player !== nv && u.alive !== false && u.col >= 0 && u.name !== 'HQ' && (bottom ? u.row > rows - 1 - reach : u.row < reach)).length;
      chilled[next] = (chilled[next] || 0) + n; chillTotal += n;
    });
  });
  console.log(`== ${b.armies[0].name} vs ${b.armies[1].name}: ${wins(0)}-${wins(1)} | rounds ${g.map(x => x.round).join(',')}`);
  console.log(`   VP ${avg((x, a) => x.vp[a])} | objectives ${avg((x, a) => x.vpBySource[a].objectives)} | primary ${avg((x, a) => x.vpBySource[a].primary)} | missions ${avg((x, a) => x.vpBySource[a].missions)}`);
  console.log(`   RP lost ${avg((x, a) => x.lostRp[a])} | damage dealt ${avg((x, a) => x.damage[a])} | enemy units caught per battle ${(chillTotal / n).toFixed(1)} by round ${JSON.stringify(chilled)}`);
}
