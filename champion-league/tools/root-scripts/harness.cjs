// Probe harness: loads the built bundle like scripts/run_unit_tests.cjs, then
// re-runs edited engine/test source files on top (overriding their globals), then
// runs the named tests (or every test whose name matches --grep).
//   node harness.cjs --root <worktree> [--src file.js]... [--test "name"]... [--grep re] [--eval file.js]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const args = process.argv.slice(2);
let root = null; const srcs = []; const names = []; let grep = null; const evals = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--root') root = args[++i];
  else if (args[i] === '--src') srcs.push(args[++i]);
  else if (args[i] === '--test') names.push(args[++i]);
  else if (args[i] === '--grep') grep = new RegExp(args[++i]);
  else if (args[i] === '--eval') evals.push(args[++i]);
}
const runnerPath = path.join(root, 'scripts', 'run_unit_tests.cjs');
let src = fs.readFileSync(runnerPath, 'utf8');
src = src.replace(/main\(\)\.catch\([\s\S]*$/, '');
src = src.replace(/^#!.*\n/, '');
const factory = new Function('require', 'module', '__dirname', '__filename',
  src + '\nreturn { installHeadlessDom, loadBundle, collectTests, runTests, GAME_HTML };');
const api = factory(require('module').createRequire(runnerPath), module, path.dirname(runnerPath), runnerPath);
api.installHeadlessDom();
const origLog = console.log;
api.loadBundle(api.GAME_HTML);
for (const s of srcs) {
  const abs = path.resolve(root, s);
  vm.runInThisContext(fs.readFileSync(abs, 'utf8').replace(/^registerBattleStateField\(.*$/mg, ''), { filename: s });
}
(async () => {
  for (const e of evals) {
    const out = vm.runInThisContext(fs.readFileSync(e, 'utf8'), { filename: e });
    origLog('EVAL', e, typeof out === 'string' ? out : JSON.stringify(out, null, 1));
  }
  if (!names.length && !grep) return;
  const tests = api.collectTests().filter(t => names.indexOf(t.name) >= 0 || (grep && grep.test(t.name)));
  let pass = 0, fail = 0;
  for (const t of tests) {
    const r = await api.runTests([t]);
    const res = r[0];
    if (res.ok) { pass++; origLog('PASS', t.name); } else { fail++; origLog('FAIL', t.name, '::', res.error); }
  }
  origLog('TOTAL', pass, 'passed', fail, 'failed');
})().catch(e => { origLog(e && e.stack || String(e)); process.exit(1); });
