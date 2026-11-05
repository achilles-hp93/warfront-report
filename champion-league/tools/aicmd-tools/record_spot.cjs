'use strict';
// Scratch (not committed): record.cjs (from <repo>, the record tool) with the command
// probe and the what-if probe installed, the what-if asking the engine files listed in
// NEWSRC_REPO's change set. Usage: NEWSRC_REPO=<worktree> node record_whatif.cjs <repo> <record args...>
const fs = require('fs');
const path = require('path');
const Module = require('module');
const repo = process.argv[2];
const file = path.join(repo, 'scripts', 'battle_report', 'record.cjs');
const newRepo = process.env.NEWSRC_REPO;
const FILES = ['ai/movement/move_choice.js', 'ai/command/held_objective.js', 'ai/movement/presence_stake.js',
  'ai/movement/presence_missions.js', 'ai/command/extra_move_value.js', 'ai/command/bought_move.js', 'ai/command/choose.js',
  'ai/command/objective_hold_value.js', 'ai/effect_value.js', 'ai/command/support.js', 'ai/command/generic_scoring.js',
  'ai/movement/destination_choice.js', 'ai/movement/evaluators.js', 'ai/movement/advance_plan.js', 'ai/movement/presence_vp.js',
  'ai/movement/decide.js', 'ai/movement/fall_back_weighing.js'].concat((process.env.EXTRA_FILES || '').split(',').filter(Boolean));
const source = FILES.map(f => fs.readFileSync(path.join(newRepo, 'engine', 'modules', f), 'utf8')
  .replace(/^'use strict';\s*$/gm, '')).join('\n;\n');
const probe = fs.readFileSync(path.join(__dirname, 'page_cmd_probe.js'), 'utf8')
  + '\nwindow.__aicmdNewSource = ' + JSON.stringify(source) + ';\n'
  + fs.readFileSync(path.join(__dirname, 'page_whatif.js'), 'utf8')
  + '\n' + fs.readFileSync(path.join(__dirname, process.env.EXTRA_PAGE || 'page_spot.js'), 'utf8');
// A loaded machine: every page eval and CDP call gets at least five minutes.
const cdp = require(path.join(repo, 'scripts', 'lib', 'cdp.cjs'));
const origEval = cdp.CdpPage.prototype.eval;
cdp.CdpPage.prototype.eval = function(expression, timeoutMs) { return origEval.call(this, expression, Math.max(300000, timeoutMs || 0)); };
const origSend = cdp.CdpConnection.prototype.send;
cdp.CdpConnection.prototype.send = function(method, params, sessionId, timeoutMs) { return origSend.call(this, method, params, sessionId, Math.max(300000, timeoutMs || 0)); };
const driver = require(path.join(repo, 'scripts', 'battle_report', 'skirmish_driver.cjs'));
const origPlay = driver.playBattle;
driver.playBattle = function(page, o) { return origPlay(page, Object.assign({}, o, { stallMs: 900000 })); };
const origWait = cdp.CdpPage.prototype.waitFor;
cdp.CdpPage.prototype.waitFor = function(expression, timeoutMs) { return origWait.call(this, expression, 5 * (timeoutMs || 10000)); };
let src = fs.readFileSync(file, 'utf8');
const a = "installAiPerfRecorder(window.__battleRecord)';\nconst INSTALL_LEAN";
const b = 'transport: R.transport || null, terrain: R.terrain || null, formations: R.formations || null,\n    log:';
if (src.indexOf(a) < 0 || src.indexOf(b) < 0) throw new Error('patch failed');
src = src.replace(a, "installAiPerfRecorder(window.__battleRecord); ' + " + JSON.stringify(probe) + ";\nconst INSTALL_LEAN");
src = src.replace(b, 'transport: R.transport || null, terrain: R.terrain || null, formations: R.formations || null, probe: R.probe || null,\n    log:');
src = src.replace('if (require.main === module) {', 'if (true) {');
// A loaded machine: the page gets five minutes to boot.
src = src.replace("!document.getElementById('boot-loading')`, 60000)", "!document.getElementById('boot-loading')`, 300000)");
process.argv = [process.argv[0], file].concat(process.argv.slice(3));
const m = new Module(file, module);
m.filename = file;
m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(src, file);
