'use strict';
// Scratch (not committed): run_unit_tests.cjs with extra scripts evaluated after the
// built bundle and before the tests are collected - new test files (no rebuild) and
// "fix patched out" overrides. Usage:
//   EXTRA=a.js,b.js node unit_extra.cjs <repo> --skip-build [--test "<exact name>"]
const fs = require('fs');
const path = require('path');
const Module = require('module');
const repo = process.argv[2];
const file = path.join(repo, 'scripts', 'run_unit_tests.cjs');
let src = fs.readFileSync(file, 'utf8');
const hook = '  loadBundle(GAME_HTML);\n';
if (src.indexOf(hook) < 0) throw new Error('patch failed');
src = src.replace(hook, hook + "  (process.env.EXTRA || '').split(',').filter(Boolean).forEach(function(f) { vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f }); });\n");
const run = '  const results = await runTests(tests, options.testName);\n';
if (src.indexOf(run) < 0) throw new Error('patch failed (run)');
src = src.replace(run, "  const only = (process.env.NAMES || '').split('||').filter(Boolean);\n"
  + "  const results = await runTests(only.length ? tests.filter(function(t) { return only.indexOf(t.name) >= 0 || only.some(function(o) { return o.endsWith('*') && t.name.indexOf(o.slice(0, -1)) === 0; }); }) : tests, options.testName);\n");
process.argv = [process.argv[0], file].concat(process.argv.slice(3));
const m = new Module(file, module);
m.filename = file;
m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(src, file);
