'use strict';
// Scratch (not committed): record.cjs with page_bog_probe.js installed after the
// recorders and its R.hq / R.picks in the record. Usage: node record_probe.cjs <repo> <record args...>
const fs = require('fs');
const path = require('path');
const Module = require('module');
const repo = process.argv[2];
const file = path.join(repo, 'scripts', 'battle_report', 'record.cjs');
const probe = fs.readFileSync(path.join(__dirname, 'page_bog_probe.js'), 'utf8');
let src = fs.readFileSync(file, 'utf8');
src = src.replace("installAiPerfRecorder(window.__battleRecord)';\nconst INSTALL_LEAN",
  "installAiPerfRecorder(window.__battleRecord); ' + " + JSON.stringify(probe) + ";\nconst INSTALL_LEAN");
src = src.replace('passives: R.passives || null, aiPerf: R.aiPerf || null,', 'passives: R.passives || null, aiPerf: R.aiPerf || null, hq: R.hq || null, picks: R.picks || null,');
if (!/hq: R\.hq/.test(src) || !/page_loot_probe|__battleRecord;\n  R\.hq/.test(src) && src.indexOf('R.hq = []') < 0) throw new Error('patch failed');
src = src.replace('if (require.main === module) {', 'if (true) {');
process.argv = [process.argv[0], file].concat(process.argv.slice(3));
const m = new Module(file, module);
m.filename = file;
m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(src, file);
