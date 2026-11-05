// Load the built engine (WARFRONT_OUTPUT_DIR) in Node and run a JS file in its global scope.
// usage: node node_eval.cjs <snippet.js>
'use strict';
const fs = require('fs');
const vm = require('vm');
const h = require('/home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b/scripts/ai_scenarios/run.cjs');
h.loadEngine();
const out = vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'), { filename: process.argv[2] });
console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
