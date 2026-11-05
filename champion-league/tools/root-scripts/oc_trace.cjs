'use strict';
const path = require('path'), vm = require('vm'), os = require('os');
let ctx = null; const orig = vm.runInContext;
vm.runInContext = function(src, c, opts) { const out = orig.apply(this, arguments); if (opts && opts.filename === 'warfront-engine.js') ctx = c; return out; };
const { runOneGame } = require('/home/user/warfront/scripts/ai_selfplay/match_runner.cjs');
runOneGame({ roundCap: 1, recordReplayPath: path.join(os.tmpdir(), 'oct.json'), skirmishMode: 'seize_the_ground' });
const log = orig('globalThis.__ocLog || []', ctx);
console.log('entries', log.length);
log.slice(6).forEach(function(s) { console.log('----\n' + s); });
