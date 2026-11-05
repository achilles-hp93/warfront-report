#!/bin/bash
# The full gate on the small5 build, one step after another.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
export WARFRONT_OUTPUT_DIR=$S/wt-small5-out
export CHROME_PATH=/opt/pw-browsers/chromium
cd /home/user/warfront/.claude/worktrees/agent-a5db5b016c168d542 || exit 1
node scripts/run_unit_tests.cjs --skip-build > $S/small5-unit.log 2>&1; echo "unit exit=$?"
node scripts/run_all_tests.cjs --skip-build --phase 2.5 > $S/small5-gate25.log 2>&1; echo "2.5 exit=$?"
node scripts/run_all_tests.cjs --skip-build --phase 3 > $S/small5-gate3.log 2>&1; echo "3 exit=$?"
node scripts/run_all_tests.cjs --skip-build --phase 4b > $S/small5-gate4b.log 2>&1; echo "4b exit=$?"
node scripts/run_browser_smoke.cjs --skip-build > $S/small5-smoke.log 2>&1; echo "smoke exit=$?"
echo GATE-DONE
