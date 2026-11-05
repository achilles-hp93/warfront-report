'use strict';
// For each Secure Objective use: was the unit in an Objective Area when it was bought
// (its square at the end of the round before), and did it end the round in one?
// And: units that held an objective alone (only friendly in the area) at a round's
// end and stood outside every area at the next round's end while still alive.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const cheb = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
let so = 0, soInBefore = 0, soLeft = 0, leftAlone = 0, left = [];
const out = [];
for (let i = 1; i <= 24; i++) {
  const id = 'cl-s1-d1-d1-m' + String(i).padStart(2, '0');
  const r = JSON.parse(fs.readFileSync(path.join(dir, 'battle_reports', id, 'report.json'), 'utf8'));
  const snaps = r.snaps.filter(s => /^end of round/.test(s.label) || /final/i.test(s.label));
  const snapAt = n => snaps.find(s => s.round === n);
  const deploy = r.snaps.find(s => !/^end of round/.test(s.label));
  const area = (s, u) => u && u.alive && u.col >= 0 ? s.objectives.findIndex(o => cheb(o, u) <= 1) : -1;
  for (const use of r.uses.filter(u => u.name === 'Secure Objective')) {
    so++;
    const before = use.round > 1 ? snapAt(use.round - 1) : deploy;
    const after = snapAt(use.round);
    const ub = before && before.units.find(u => u.uid === use.target);
    const ua = after && after.units.find(u => u.uid === use.target);
    const ab = before ? area(before, ub) : -1, aa = after ? area(after, ua) : -1;
    if (ab >= 0) soInBefore++;
    const leftIt = ab >= 0 && ua && ua.alive && aa !== ab;
    if (leftIt) soLeft++;
    out.push(`${id.slice(-3)} R${use.round} ${ub ? ub.name : use.target}: before ${ab >= 0 ? 'in area ' + ab : 'not in an area'}, end ${!ua || !ua.alive ? 'destroyed' : aa >= 0 ? 'in area ' + aa : 'not in an area'}${leftIt ? '  <-- LEFT' : ''}`);
  }
  for (let n = 1; n < snaps.length; n++) {
    const s0 = snaps[n - 1], s1 = snaps[n];
    s0.objectives.forEach((o, k) => {
      const inArea = s0.units.filter(u => u.alive && u.col >= 0 && cheb(o, u) <= 1 && !u.isHQ);
      const sides = new Set(inArea.map(u => u.player));
      if (sides.size !== 1 || inArea.length !== 1) return;
      const u = inArea[0], u1 = s1.units.find(x => x.uid === u.uid);
      if (u1 && u1.alive && u1.col >= 0 && cheb(o, u1) > 1) {
        const stillAny = s1.units.some(x => x.alive && x.player === u.player && x.col >= 0 && cheb(o, x) <= 1);
        if (!stillAny) { leftAlone++; left.push(`${id.slice(-3)} R${s1.round} ${u.name} left objective ${k} (${o.vp} VP) empty`); }
      }
    });
  }
}
console.log(out.join('\n'));
console.log(`\nSecure Objective uses ${so}: in an area when bought ${soInBefore}; left that area in the round ${soLeft}`);
console.log(`Sole holders that walked off and left the objective empty of friends: ${leftAlone}`);
console.log(left.join('\n'));
