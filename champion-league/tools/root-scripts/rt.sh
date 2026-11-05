#!/bin/bash
# Run named unit tests (exact names, one per line in a file or as args) against my build.
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-pair-out
cd /home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d || exit 1
for name in "$@"; do
  node scripts/run_unit_tests.cjs --skip-build --test "$name" 2>&1 | grep -E "^(TOTAL|FAIL|PASS|Error)" | head -5
done
