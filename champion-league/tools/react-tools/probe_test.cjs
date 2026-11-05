// Run the repo's current copy of test file(s) against a built page without rebuilding:
//   REPO=... node probe_test.cjs <built dir> <test file> [patch.json]
// Every test name in the file gets a 'PROBE ' prefix so it does not clash with the built copy.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [src, file, patch] = process.argv.slice(2);
const tmp = path.join(__dirname, 'probe_test_tmp.js');
let text = fs.readFileSync(file, 'utf8');
const names = [];
text = text.replace(/test: \{ name: '((?:[^'\\]|\\.)*)'/g, (m, n) => { names.push(n.replace(/\\'/g, "'")); return "test: { name: 'PROBE " + n + "'"; });
fs.writeFileSync(tmp, text);
const only = process.env.ONLY;
for (const n of names.filter(x => !only || x.indexOf(only) >= 0)) {
  const r = cp.spawnSync('node', [path.join(__dirname, 'probe.cjs'), src, tmp, 'PROBE ' + n].concat(patch ? [patch] : []), { env: process.env, encoding: 'utf8', maxBuffer: 1 << 28 });
  const lines = (r.stdout || '').split('\n').filter(l => /^(PASS|FAIL|TOTAL|patch)/.test(l));
  console.log(lines.join('\n') || r.stdout.slice(-2000) + r.stderr.slice(-2000));
}
