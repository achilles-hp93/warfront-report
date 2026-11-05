'use strict';
// Loots over a recorded battle, and its Inscribe / Plunder / rune log lines.
const fs = require('fs');
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const pools = (report.resources || []).filter(r => r.kind === 'pool' && r.pool === 'loots');
pools.forEach(r => console.log(`R${r.round} ${r.phase} P${r.player} ${r.delta > 0 ? '+' : ''}${r.delta} -> ${r.total} ${r.note || ''}`));
(report.log || []).filter(l => /inscri|Plunder|Rune|Loots|Hostile|Liquidat/i.test(typeof l === 'string' ? l : (l.text || l.msg || JSON.stringify(l))))
  .forEach(l => console.log('LOG', typeof l === 'string' ? l : (l.round != null ? 'R' + l.round + ' ' : '') + (l.text || l.msg || JSON.stringify(l))));
const units = report.units || [];
const rs = units.filter(u => /Runesmith/.test(u.name));
console.log('runesmith', JSON.stringify(rs.map(u => ({ alive: u.alive, stats: u.stats && { dealt: u.stats.totalDmgDealt } }))));
(report.activity || []).filter(a => rs.some(u => u.uid === a.uid)).forEach(a => console.log('ACT', JSON.stringify(a)));
