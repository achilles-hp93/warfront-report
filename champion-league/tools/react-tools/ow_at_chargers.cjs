// For each record, count Overwatch reactions that answered a CHARGE (the line before the
// Overwatch lines names the target charging) and their damage.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
let tot = { charges: 0, owAtCharger: 0, owDmg: 0, owAll: 0 };
for (const n of fs.readdirSync(dir).sort()) {
  const f = path.join(dir, n, 'report.json');
  if (!fs.existsSync(f)) continue;
  const L = JSON.parse(fs.readFileSync(f, 'utf8')).log.map(l => l.msg || '');
  let charges = 0, at = 0, dmg = 0, all = 0, lastCharger = null;
  let lastKind = null;
  L.forEach(m => {
    if (/ Charges /.test(m)) { charges++; lastCharger = m.split(' Charges ')[0].replace(/^\[.*?\] /, '').trim(); lastKind = 'charge'; return; }
    const mv = /^(.+?) moved to \(/.exec(m);
    if (mv) { lastCharger = mv[1].trim(); lastKind = 'move'; return; }
    const o = /Overwatch Reaction vs (.+?): (?:(\d+) damage|no damage)/.exec(m);
    if (o) {
      all++;
      if (lastKind === 'charge' && o[1] === lastCharger) { at++; dmg += Number(o[2] || 0); }
    }
  });
  console.log(n, JSON.stringify({ charges, owAtCharger: at, owDmg: dmg, owAll: all }));
  tot.charges += charges; tot.owAtCharger += at; tot.owDmg += dmg; tot.owAll += all;
}
console.log('TOTAL', JSON.stringify(tot));
