'use strict';
// Scratch: compare a replay (same build, new recorder) with the check run's record:
// does the battle match, and which idle entries changed.
//   node cmp_idle.cjs <NN> <replay report.json>
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const [nn, file] = process.argv.slice(2);
const orig = JSON.parse(fs.readFileSync(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${nn}/report.json`, 'utf8'));
const rep = JSON.parse(fs.readFileSync(file, 'utf8'));
const key = m => `${m.round}|${m.phase}|${m.name}|${m.from.col},${m.from.row}->${m.to.col},${m.to.row}|${m.charged}`;
const ck = c => `${c.round}|${c.phase}|${c.kind}|${c.attacker && c.attacker.name}|${c.target && c.target.name}|${JSON.stringify((c.losses || []).map(l => l.lost))}`;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
console.log(`m${nn} replay matches: moves ${same(orig.moves.map(key), rep.moves.map(key))}, combats ${same(orig.combats.map(ck), rep.combats.map(ck))}, result ${JSON.stringify(orig.result) === JSON.stringify(rep.result)}`);
const names = {}; orig.units.forEach(u => { names[u.uid] = u.name; });
const idleKey = e => `R${e.round} ${names[e.uid]}`;
const a = orig.activity.filter(e => e.kind === 'idle').map(idleKey);
const b = rep.activity.filter(e => e.kind === 'idle').map(idleKey);
const nonIdle = r => JSON.stringify(r.activity.filter(e => e.kind !== 'idle').map(e => [e.round, e.uid, e.kind]));
console.log(`other activity entries identical: ${nonIdle(orig) === nonIdle(rep)}`);
console.log(`idle entries: record ${a.length}, replay ${b.length}`);
console.log('  dropped: ' + a.filter(x => !b.includes(x)).join('; '));
console.log('  added:   ' + b.filter(x => !a.includes(x)).join('; '));
const noWhy = r => r.activity.filter(e => e.kind === 'idle' && !e.why).map(idleKey);
console.log(`idle entries with no why: record ${noWhy(orig).length}, replay ${noWhy(rep).length} (${noWhy(rep).join('; ')})`);
