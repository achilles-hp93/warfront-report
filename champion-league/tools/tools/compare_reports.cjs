// Compare two battle report.json files: result and combat log line by line,
// plus moves and combats. Exit 1 on any difference.
const fs = require('fs');
const [aPath, bPath] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync(aPath, 'utf8'));
const b = JSON.parse(fs.readFileSync(bPath, 'utf8'));
let bad = 0;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
console.log('A result', JSON.stringify(a.result));
console.log('B result', JSON.stringify(b.result));
if (!same(a.result, b.result)) { console.log('RESULT DIFFERS'); bad++; }
const la = a.log.map(e => `[${e.round}/${e.phase}] ${e.msg}`);
const lb = b.log.map(e => `[${e.round}/${e.phase}] ${e.msg}`);
console.log('log lines', la.length, lb.length);
const n = Math.max(la.length, lb.length);
let firstDiff = -1, diffs = 0;
for (let i = 0; i < n; i++) if (la[i] !== lb[i]) { diffs++; if (firstDiff < 0) firstDiff = i; }
if (diffs) {
  bad++;
  console.log('LOG DIFFERS: ' + diffs + ' lines, first at ' + firstDiff);
  for (let i = Math.max(0, firstDiff - 3); i < Math.min(n, firstDiff + 5); i++) console.log(i, (la[i] === lb[i] ? '  ' : '!!'), 'A:', la[i], '\n', '        B:', lb[i]);
} else console.log('combat log identical line by line');
for (const key of ['moves', 'combats', 'resources', 'primary', 'missions']) {
  const ok = same(a[key], b[key]);
  console.log(key, ok ? 'identical' : 'DIFFER', (a[key] || []).length, (b[key] || []).length);
  if (!ok) bad++;
}
const ua = (a.units || []).map(u => [u.uid, u.name, u.alive, JSON.stringify(u.stats)].join('|'));
const ub = (b.units || []).map(u => [u.uid, u.name, u.alive, JSON.stringify(u.stats)].join('|'));
console.log('final units', same(ua, ub) ? 'identical' : 'DIFFER');
if (!same(ua, ub)) bad++;
console.log('errors A', a.errors.length, 'B', b.errors.length);
if (a.errors.length || b.errors.length) console.log(a.errors.slice(0, 5), b.errors.slice(0, 5));
console.log(bad ? 'DIFFERENT' : 'IDENTICAL');
process.exit(bad ? 1 : 0);
