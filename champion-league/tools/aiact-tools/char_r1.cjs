// Scratch (aiact): joined CHARACTERs in Round 1 - did their pair ADVANCE, did they act or idle.
const fs = require('fs');
let tot = { chars: 0, pairAdv: 0, idle: 0, advIdle: 0, acted: 0 };
for (const arg of process.argv.slice(2)) {
  const [label, file] = arg.split('=');
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  const chars = r.meta ? (r.meta.armies || []).flat().filter(u => u.character && u.joined)
    : (r.units || []).filter(u => u.character && u.joined);
  // probe output: `joined` is the end-of-round state; keep those whose pair moved together in R1
  let row = { chars: 0, pairAdv: 0, idle: 0, advIdle: 0, acted: 0 };
  chars.forEach(u => {
    const pairMove = (r.moves || []).find(m => m.round === 1 && m.phase === 'MOVEMENT' && m.partner === u.name && m.player === u.player);
    if (!pairMove) return;
    const idle = (r.activity || []).some(a => a.round === 1 && a.uid === u.uid && a.kind === 'idle');
    const acted = (r.activity || []).some(a => a.round === 1 && a.uid === u.uid && ['ranged', 'melee', 'magic', 'ability'].includes(a.kind));
    row.chars++; if (pairMove.advanced) row.pairAdv++; if (idle) row.idle++; if (idle && pairMove.advanced) row.advIdle++; if (acted) row.acted++;
  });
  Object.keys(tot).forEach(k => tot[k] += row[k]);
  console.log(label, JSON.stringify(row));
}
console.log('TOTAL', JSON.stringify(tot));
