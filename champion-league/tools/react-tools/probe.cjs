// Run a probe test file against a built page without rebuilding:
//   node probe.cjs <built output dir> <probe js> "<test name>" [patch.json]
// Copies the page into react-probe-out with the probe file appended inside its script,
// optionally applying [{old,new}] string patches (every occurrence), then runs the unit
// runner on that one test.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [src, probe, name, patchFile] = process.argv.slice(2);
const S = path.resolve(__dirname, '..');
const out = path.join(S, 'react-probe-out');
fs.mkdirSync(out, { recursive: true });
let html = fs.readFileSync(path.join(src, 'warfront-fantasy.html'), 'utf8');
if (patchFile) {
  for (const p of JSON.parse(fs.readFileSync(patchFile, 'utf8'))) {
    const n = html.split(p.old).length - 1;
    console.log('patch occurrences', n, JSON.stringify(p.old.slice(0, 60)));
    if (!n) throw new Error('patch not found');
    html = html.split(p.old).join(p.new);
  }
}
if (probe && probe !== '-') {
  const at = html.lastIndexOf('</script>');
  html = html.slice(0, at) + '\n' + fs.readFileSync(probe, 'utf8') + '\n' + html.slice(at);
}
fs.writeFileSync(path.join(out, 'warfront-fantasy.html'), html);
const repo = process.env.REPO;
const args = [path.join(repo, 'scripts/run_unit_tests.cjs'), '--skip-build'];
if (name) args.push('--test', name);
const r = cp.spawnSync('node', args, { cwd: repo, env: Object.assign({}, process.env, { WARFRONT_OUTPUT_DIR: out }), encoding: 'utf8', maxBuffer: 1 << 28 });
process.stdout.write((r.stdout || '').split('\n').filter(l => !/^\[TEST\] Loading/.test(l)).slice(-60).join('\n'));
process.stderr.write((r.stderr || '').slice(-4000));
