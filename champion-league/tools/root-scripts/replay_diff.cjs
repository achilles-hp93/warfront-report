'use strict';
// Play the self-play replay test's game, play its replay back, print the state diffs.
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm');
const R = '/home/user/warfront';
let ctx = null;
const orig = vm.runInContext;
vm.runInContext = function(src, c, opts) { const out = orig.apply(this, arguments); if (opts && opts.filename === 'warfront-engine.js') ctx = c; return out; };
const { runOneGame } = require(path.join(R, 'scripts', 'ai_selfplay', 'match_runner.cjs'));
const file = path.join(os.tmpdir(), 'rdiff-' + process.pid + '.json');
runOneGame({ roundCap: 1, recordReplayPath: file, skirmishMode: 'seize_the_ground' });
vm.runInContext = orig;
const replay = JSON.parse(fs.readFileSync(file, 'utf8'));
const recSnap = JSON.parse(vm.runInContext('JSON.stringify(buildBattleStateChecksumSnapshot())', ctx));
const { ENGINE_PATH } = require(path.join(R, 'scripts', 'lib', 'replay_playback.cjs'));
const pctx = vm.createContext({ console: { log() {}, info() {}, debug() {}, warn(...a) { console.log('WARN', ...a); }, error(...a) { console.log('ERR', ...a); } },
  setTimeout, clearTimeout, setInterval, clearInterval, Math: Object.create(Math), module: { exports: {} }, exports: {} });
orig(fs.readFileSync(ENGINE_PATH, 'utf8'), pctx, { filename: 'playback-engine.js' });
pctx.G = pctx.module.exports.createGameState();
pctx.__replay = replay;
orig('Replay.begin(__replay); while (Replay.hasMore()) Replay.stepForward();', pctx);
const backSnap = JSON.parse(orig('JSON.stringify(buildBattleStateChecksumSnapshot())', pctx));
pctx.__a = recSnap; pctx.__b = backSnap;
const diffs = orig('diffBattleStateSnapshots(__a, __b, 25)', pctx);
console.log('actions', replay.actions.length);
console.log(JSON.stringify(diffs, null, 1).slice(0, 6000));

const probe = 'JSON.stringify(G.units.map(function(u, i) { return [i, u.name, u.player, u.oc, Stats.unit(u, "OC").value, (Modifiers.list ? "" : ""), JSON.stringify((u.activeMods||[]).length), u.col + "," + u.row]; }))';
console.log('REC ', orig(probe, ctx));
console.log('BACK', orig(probe, pctx));
console.log('REC round/phase', orig('G.round + " " + G.battlePhase + " " + G.phase', ctx), '| BACK', orig('G.round + " " + G.battlePhase + " " + G.phase', pctx));
