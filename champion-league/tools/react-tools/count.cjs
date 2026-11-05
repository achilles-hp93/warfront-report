// Count charges and reactions per battle in a reports dir: node count.cjs <reports dir> [names...]
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const names = process.argv.slice(3).length ? process.argv.slice(3) : fs.readdirSync(dir);
const rows = [];
for (const n of names) {
  const f = path.join(dir, n, 'report.json');
  if (!fs.existsSync(f)) continue;
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const L = r.log.map(l => l.msg || '');
  const cnt = re => L.filter(m => re.test(m)).length;
  const P = r.aiPerf || { decisions: [], picks: [] };
  const sum = (xs) => Math.round(xs.reduce((t, d) => t + d.ms, 0));
  const part = name => Math.round(P.decisions.reduce((t, d) => t + ((d.parts || {})[name] ? d.parts[name][0] : 0), 0));
  rows.push({ n, rounds: r.result && r.result.round, vp: r.result && r.result.vp,
    charges: cnt(/ Charges /), failed: cnt(/CHARGE FAILED/), overwatch: cnt(/Overwatch Reaction/), ccMade: cnt(/COUNTERCHARGES/),
    ccCanceled: cnt(/canceled by the Countercharge/), faec: cnt(/: fires on .* damage\)/),
    aiMs: sum(P.decisions) + sum(P.picks), decMs: sum(P.decisions), moveMs: part('aiDecideMovement'), fbMs: part('_aiEvalFallBack') });
}
rows.forEach(r => console.log(JSON.stringify(r)));
