// List every army-pick use of a batch with the attacks it priced.
const fs = require('fs');
const dir = process.argv[2];
const re = new RegExp(process.argv[3] || 'Hymn|Mantle');
for (const f of fs.readdirSync(dir + '/games').sort()) {
  const r = JSON.parse(fs.readFileSync(dir + '/games/' + f));
  const name = {}; (r.meta.armies || []).flat().concat(r.units || []).forEach(u => { name[u.uid] = u.name; });
  for (const u of r.uses || []) {
    if (!re.test(u.name)) continue;
    const p = (u.changes.picks || [])[0] || {};
    console.log(`${f} R${u.round} #${u.id} ${u.name} -> ${name[p.uid]} (${p.uid})`);
    for (const g of u.gains) console.log(`    ${g.kind} R${g.round} ${g.phase} ${g.domain || ''} ${name[g.attacker]}(${g.attacker}) -> ${name[g.target]}(${g.target}) with ${g.with} without ${g.without} gain ${g.gain} actual ${g.actual}`);
  }
}
