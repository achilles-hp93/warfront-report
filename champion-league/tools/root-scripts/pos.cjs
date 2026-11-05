'use strict';
// Where each side-A unit stood at each snapshot, and who stood beside the Runesmith.
const fs = require('fs');
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(report.snaps || []).forEach(s => {
  const units = (s.units || []).filter(u => u.alive);
  const rs = units.find(u => /Runesmith/.test(u.name));
  const line = units.filter(u => u.player === 0).map(u => `${u.name}@${u.col},${u.row}`).join('  ');
  const near = rs ? units.filter(u => u !== rs && u.player === 0 && Math.max(Math.abs(u.col - rs.col), Math.abs(u.row - rs.row)) <= 1).map(u => u.name) : [];
  console.log(`[${s.label}] ${line}\n   beside the Runesmith: ${near.join(', ') || '-'}`);
});
(report.moves || []).filter(m => /Runesmith/.test(m.name)).forEach(m => console.log('MOVE', `R${m.round} ${m.phase} ${m.from.col},${m.from.row} -> ${m.to.col},${m.to.row}`));
