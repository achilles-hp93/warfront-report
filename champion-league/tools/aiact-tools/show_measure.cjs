const fs = require('fs');
const o = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(o.probe.rows || []).forEach(r => {
  console.log(`R${r.round} P${r.player} ${r.unit} @${r.at} -> ${r.choice}`);
  r.members.forEach(m => console.log(`    ${m.name}: best ${m.best} ${m.score} (${m.ms} ms) shot ${m.shot}`));
});
console.log('errors', o.probe.errors.slice(0, 5));
console.log('moves:'); o.moves.forEach(m => console.log(`  R${m.round} ${m.name}${m.partner ? ' + ' + m.partner : ''} ${m.from.col},${m.from.row}->${m.to.col},${m.to.row} ${m.advanced ? 'ADV' : ''}${m.charged ? 'CHG' : ''}`));
const names = {}; o.units.forEach(u => names[u.uid] = u.name);
console.log('activity:'); o.activity.forEach(a => console.log(`  R${a.round} ${a.phase} ${names[a.uid]} ${a.kind} ${a.why ? JSON.stringify(a.why) : ''}`));
