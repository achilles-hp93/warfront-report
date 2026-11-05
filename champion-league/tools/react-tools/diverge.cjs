// First divergence between two records' moves and combats: node diverge.cjs a.json b.json
const fs = require('fs');
const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const key = m => [m.round, m.phase, m.name, m.from && m.from.col + ',' + m.from.row, m.to && m.to.col + ',' + m.to.row, m.charged, m.advanced].join(' ');
const n = Math.max(a.moves.length, b.moves.length);
for (let i = 0; i < n; i++) {
  const x = a.moves[i], y = b.moves[i];
  if (!x || !y || key(x) !== key(y)) {
    console.log('moves diverge at', i);
    for (let j = Math.max(0, i - 2); j < Math.min(n, i + 4); j++) console.log('  A', a.moves[j] && key(a.moves[j]), '\n  B', b.moves[j] && key(b.moves[j]));
    break;
  }
}
const la = a.log.map(l => l.round + ' ' + l.phase + ' ' + l.msg), lb = b.log.map(l => l.round + ' ' + l.phase + ' ' + l.msg);
for (let i = 0; i < Math.max(la.length, lb.length); i++) {
  if (la[i] !== lb[i]) {
    console.log('log diverges at', i);
    for (let j = Math.max(0, i - 6); j < i + 4; j++) console.log('  A', (la[j] || '').slice(0, 170), '\n  B', (lb[j] || '').slice(0, 170));
    break;
  }
}
