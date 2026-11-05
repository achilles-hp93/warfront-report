#!/bin/bash
# Run each new test on the negative build (every change patched out), then print the rows.
cd /home/user/warfront/.claude/worktrees/agent-a40f030ca73460094 || exit 1
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/rules4-neg
for t in \
  "MS Threshold: an MS of 0 or below reads as 0 on the MS table" \
  "Combat migration: melee legality and initiative read canonical model stats without projection sync" \
  "grant_move: queued, fall back, charge, choice, once-per-round, staged step and immediate move-order shapes, each through its consumer" \
  "Advance, Fall Back and Charge count for both units of a pair" \
  "Falling back is worth the shots it opens: a squad shielding an enemy from the gun line opens it by leaving"; do
  echo "=== $t"
  node scripts/run_unit_tests.cjs --skip-build --test "$t" 2>&1 | grep -E "PASS|FAIL|passed|failed|not found|No test" | head -6
done
