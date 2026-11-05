#!/bin/bash
# The full gate on the worktree build, one phase after another.
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-aicmd-out CHROME_PATH=/opt/pw-browsers/chromium
L=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-gate
for p in 2.5 3 4b; do
  timeout 5400 node scripts/run_all_tests.cjs --skip-build --phase $p > $L-$p.log 2>&1; echo "phase $p EXIT $?"
done
timeout 3600 node scripts/run_browser_smoke.cjs --skip-build > $L-smoke.log 2>&1; echo "smoke EXIT $?"
