// node est.cjs <report.json> [round|uid prefix]: the charges declared with the AI's own Reaction
// estimate for the square, and every estimate under the given key prefix.
const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const P = r.reactProbe || {};
console.log('estimates', Object.keys(P.estimates || {}).length);
(P.charges || []).forEach(c => console.log(JSON.stringify({ r: c.round, n: c.name, uid: c.uid, from: c.from, to: c.to,
  cc: c.ccGated, cp: c.cp, watchers: c.watchers, est: c.estimate })));
const pre = process.argv[3];
if (pre) Object.entries(P.estimates || {}).filter(([k]) => k.startsWith(pre)).forEach(([k, v]) => console.log(k, JSON.stringify(v)));
