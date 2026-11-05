// Combats by round in each game of a batch, those by or on the given uids flagged.
const fs = require('fs');
const dir = process.argv[2];
const round = Number(process.argv[3] || 1);
for (const f of fs.readdirSync(dir + '/games').sort()) {
  const r = JSON.parse(fs.readFileSync(dir + '/games/' + f));
  const cs = (r.combats || []).filter(c => c.round === round);
  console.log(f, 'combats in R' + round + ':', cs.length);
  cs.forEach(c => console.log('   ', c.phase, c.kind || c.domain || '', c.attacker && c.attacker.name, c.attacker && c.attacker.uid, '->', c.target && c.target.name, c.target && c.target.uid));
}
