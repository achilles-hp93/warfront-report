'use strict';
// Scratch harness: load the built game headless (as run_unit_tests.cjs does) and run a
// probe file's code against the live globals. Usage: node probe.cjs <repo> <probe.js>
const fs = require('fs');
const path = require('path');
const Module = require('module');
const repo = process.argv[2];
const probe = fs.readFileSync(process.argv[3], 'utf8');
const runner = path.join(repo, 'scripts', 'run_unit_tests.cjs');
let src = fs.readFileSync(runner, 'utf8');
src = src.replace(/main\(\)\.catch\([\s\S]*$/, `
installHeadlessDom();
loadBundle(GAME_HTML);
const __probe = ${JSON.stringify(probe)};
try { console.log('PROBE', JSON.stringify((0, eval)(__probe), null, 1)); } catch (e) { console.log('PROBE ERROR', e && e.stack); }
`);
const m = new Module(runner, module);
m.filename = runner;
m.paths = Module._nodeModulePaths(path.dirname(runner));
m._compile(src, runner);
