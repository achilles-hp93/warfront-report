#!/bin/bash
# The full gate on a build dir (default wt-blunders-out2).
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
export WARFRONT_OUTPUT_DIR=${BUILD:-$S/wt-blunders-out2} CHROME_PATH=/opt/pw-browsers/chromium
cd /home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b
node scripts/run_all_tests.cjs --skip-build --phase 2.5 > $S/blunders-gate25.log 2>&1; echo "exit $?" >> $S/blunders-gate25.log
node scripts/run_all_tests.cjs --skip-build --phase 3 > $S/blunders-gate3.log 2>&1; echo "exit $?" >> $S/blunders-gate3.log
node scripts/run_all_tests.cjs --skip-build --phase 4b > $S/blunders-gate4b.log 2>&1; echo "exit $?" >> $S/blunders-gate4b.log
node scripts/run_browser_smoke.cjs --skip-build > $S/blunders-smoke.log 2>&1; echo "exit $?" >> $S/blunders-smoke.log
echo "gate done" >> $S/blunders-smoke.log
