#!/bin/bash
# The full gate on the final build.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/agent-aad34c53b85fa4e08
export WARFRONT_OUTPUT_DIR=$S/wt-react-out3 CHROME_PATH=/opt/pw-browsers/chromium
node scripts/run_all_tests.cjs --skip-build --phase 2.5 > $S/react-gate25.log 2>&1; echo "2.5 exit $?"
node scripts/run_all_tests.cjs --skip-build --phase 3 > $S/react-gate3.log 2>&1; echo "3 exit $?"
node scripts/run_all_tests.cjs --skip-build --phase 4b > $S/react-gate4b.log 2>&1; echo "4b exit $?"
node scripts/run_browser_smoke.cjs --skip-build > $S/react-smoke.log 2>&1; echo "smoke exit $?"
echo gate-done
