// Scratch (aiact): Round 1 ADVANCEs and Round 1 actions per battle, from a record
// (report.json, or probe.cjs output): node r1_counts.cjs <label>=<file> ...
const fs = require('fs');
const rows = [];
for (const arg of process.argv.slice(2)) {
  const [label, file] = arg.split('=');
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  const moves = (r.moves || []).filter(m => m.round === 1 && m.phase === 'MOVEMENT');
  const act = (r.activity || []).filter(a => a.round === 1);
  const units = r.units || [];
  const byUid = {}; units.forEach(u => { byUid[u.uid] = u; });
  const count = k => act.filter(a => a.kind === k).length;
  // A joined CHARACTER's pair: moves name the partner.
  const advPairs = moves.filter(m => m.advanced && m.partner).length;
  rows.push({ label, adv: moves.filter(m => m.advanced).length, walks: moves.filter(m => !m.advanced && !m.charged).length,
    charges: moves.filter(m => m.charged).length, advPairs,
    ranged: count('ranged'), magic: count('magic'), ability: count('ability'), melee: count('melee'), idle: count('idle') });
}
const keys = ['adv', 'walks', 'charges', 'advPairs', 'ranged', 'magic', 'ability', 'melee', 'idle'];
console.log(['battle'].concat(keys).join('\t'));
rows.forEach(r => console.log([r.label].concat(keys.map(k => r[k])).join('\t')));
const tot = {}; keys.forEach(k => { tot[k] = rows.reduce((s, r) => s + r[k], 0); });
console.log(['TOTAL'].concat(keys.map(k => tot[k])).join('\t'));
