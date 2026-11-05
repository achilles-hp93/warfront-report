'use strict';
// Attacks on units standing beside the Lamassu Bastion: node bastion_adj.cjs <report.json>
const r = require(process.argv[2]);
const army = (r.meta.armies || []).flat();
const bastion = army.find(u => /Lamassu/.test(u.name));
if (!bastion) { console.log('no Bastion'); process.exit(0); }
// The Bastion's square at each seq: from its moves (deployment from the first snapshot).
const snap0 = r.snaps[0].units.find(u => u.uid === bastion.uid);
const moves = (r.moves || []).filter(m => m.uid === bastion.uid || m.partner === bastion.name);
const at = seq => {
  let pos = { col: snap0.col, row: snap0.row };
  moves.forEach(m => { if (m.seq < seq) pos = m.to; });
  return pos;
};
let n = 0;
(r.combats || []).forEach(c => {
  if (!c.target || !c.target.at || c.target.player !== bastion.player || c.target.uid === bastion.uid) return;
  const b = at(c.seq);
  const d = Math.max(Math.abs(b.col - c.target.at.col), Math.abs(b.row - c.target.at.row));
  if (d === 1) { n++; console.log(`R${c.round} ${c.phase} ${c.kind}: ${c.attacker ? c.attacker.name : 'effect'} -> ${c.target.name} beside the Bastion (${(c.losses || []).map(l => l.name + ' -' + l.lost).join(', ') || 'no damage'})`); }
});
console.log(n + ' attack(s) on a unit beside the Bastion; Bastion moves: ' + moves.map(m => `R${m.round} ${m.from.col},${m.from.row}->${m.to.col},${m.to.row}`).join(', '));
