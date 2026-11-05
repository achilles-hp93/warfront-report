// Load the built engine in Node, evaluate a test SOURCE file from the worktree (its cases are
// pushed after the bundled ones) and run the cases it adds. usage: node run_src_test.cjs <suite.js> [<prelude.js>]
'use strict';
const fs = require('fs');
const vm = require('vm');
const h = require('/home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b/scripts/ai_scenarios/run.cjs');
h.loadEngine();
if (process.argv[3]) vm.runInThisContext(fs.readFileSync(process.argv[3], 'utf8'));
const before = (globalThis.__WARFRONT_TEST_CASES__ || []).length;
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'), { filename: process.argv[2] });
const added = globalThis.__WARFRONT_TEST_CASES__.slice(before);
for (const c of added) {
  let r;
  try { r = c.test.fn(); } catch (e) { r = 'THREW ' + (e.stack || e.message); }
  console.log((r === true ? 'PASS ' : 'FAIL ') + c.test.name + (r === true ? '' : ': ' + r));
}
