// Run the named tests from the worktree's current test files against the loaded bundle.
(function() {
  var fs = process.mainModule.require('fs');
  var W = '/home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090/tests/suites/';
  var files = (process.env.AIACT_FILES || '').split(',').filter(Boolean);
  var before = (globalThis.__WARFRONT_TEST_CASES__ || []).length;
  files.forEach(function(f) { (0, eval)(fs.readFileSync(W + f, 'utf8')); });
  var mine = globalThis.__WARFRONT_TEST_CASES__.slice(before);
  return mine.map(function(c) {
    var r;
    try { r = c.test.fn(); } catch (e) { r = 'THREW ' + (e && e.stack || e); }
    return (r === true ? 'PASS ' : 'FAIL ') + c.test.name + (r === true ? '' : ': ' + r);
  }).join('\n');
})()
