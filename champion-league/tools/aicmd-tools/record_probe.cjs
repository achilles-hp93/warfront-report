'use strict';
// Scratch (not committed): record.cjs with page_cmd_probe.js installed after the
// recorders and its R.probe in the record. Usage: node record_probe.cjs <repo> <record args...>
const fs = require('fs');
const path = require('path');
const Module = require('module');
const repo = process.argv[2];
const file = path.join(repo, 'scripts', 'battle_report', 'record.cjs');
const probe = fs.readFileSync(path.join(__dirname, 'page_cmd_probe.js'), 'utf8');
// A loaded machine: page evals, CDP calls and waits get more time (no effect on the battle).
const cdp = require(path.join(repo, 'scripts', 'lib', 'cdp.cjs'));
const origEval = cdp.CdpPage.prototype.eval;
cdp.CdpPage.prototype.eval = function(expression, timeoutMs) { return origEval.call(this, expression, Math.max(300000, timeoutMs || 0)); };
const origSend = cdp.CdpConnection.prototype.send;
cdp.CdpConnection.prototype.send = function(method, params, sessionId, timeoutMs) { return origSend.call(this, method, params, sessionId, Math.max(300000, timeoutMs || 0)); };
const origWait = cdp.CdpPage.prototype.waitFor;
cdp.CdpPage.prototype.waitFor = function(expression, timeoutMs) { return origWait.call(this, expression, 5 * (timeoutMs || 10000)); };
const driver = require(path.join(repo, 'scripts', 'battle_report', 'skirmish_driver.cjs'));
const origPlay = driver.playBattle;
driver.playBattle = function(page, o) { return origPlay(page, Object.assign({}, o, { stallMs: 900000 })); };
let src = fs.readFileSync(file, 'utf8');
const a = "installAiPerfRecorder(window.__battleRecord)';\nconst INSTALL_LEAN";
const b = 'transport: R.transport || null, terrain: R.terrain || null, formations: R.formations || null,\n    log:';
if (src.indexOf(a) < 0 || src.indexOf(b) < 0) throw new Error('patch failed');
src = src.replace(a, "installAiPerfRecorder(window.__battleRecord); ' + " + JSON.stringify(probe) + ";\nconst INSTALL_LEAN");
src = src.replace(b, 'transport: R.transport || null, terrain: R.terrain || null, formations: R.formations || null, probe: R.probe || null,\n    log:');
src = src.replace('if (require.main === module) {', 'if (true) {');
src = src.replace("!document.getElementById('boot-loading')`, 60000)", "!document.getElementById('boot-loading')`, 300000)");
process.argv = [process.argv[0], file].concat(process.argv.slice(3));
const m = new Module(file, module);
m.filename = file;
m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(src, file);
