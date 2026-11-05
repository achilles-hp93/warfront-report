#!/bin/bash
# usage: prove_fail.sh <patch-out js> <test file> <test name prefix*>
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
EXTRA="$1,$2" NAMES="$3" WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-aicmd-out timeout 900 node /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools/unit_extra.cjs /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 --skip-build 2>&1 | grep -E "^TOTAL|^FAIL|^PASS"
