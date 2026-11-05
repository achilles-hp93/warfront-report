#!/bin/bash
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-aicmd-out CHROME_PATH=/opt/pw-browsers/chromium
L=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-gate
timeout 5400 node scripts/run_all_tests.cjs --skip-build --phase 4b > $L-4b.log 2>&1; echo "phase 4b EXIT $?"
timeout 3600 node scripts/run_browser_smoke.cjs --skip-build > $L-smoke.log 2>&1; echo "smoke EXIT $?"
