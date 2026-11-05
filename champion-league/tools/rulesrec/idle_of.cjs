'use strict';
// Scratch: the activity entries of named units in one check-run record, by round.
//   node idle_of.cjs <NN> "<unit name>" ...
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const [nn, ...names] = process.argv.slice(2);
const file = process.env.REPORT || `${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${nn}/report.json`;
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const byUid = {}; r.units.forEach(u => { byUid[u.uid] = u; });
names.forEach(name => {
  const units = r.units.filter(u => u.name === name);
  units.forEach(u => {
    const ev = r.activity.filter(e => e.uid === u.uid).map(e => `R${e.round}:${e.kind}${e.why ? '(' + (e.why.action || 'nothing') + ')' : e.kind === 'idle' ? '(no why)' : ''}`);
    console.log(`${name} [uid ${u.uid}, P${u.player}]: ${ev.join(' ')}`);
  });
});
