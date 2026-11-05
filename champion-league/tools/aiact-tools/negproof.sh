#!/bin/bash
# Scratch (aiact): run the changed tests against the build with each change undone.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090
for w in push_gate footprint hand_check; do
  python3 $S/aiact-tools/negpatch.py $w $S/aiact-neg
  echo "== without $w"
  WARFRONT_OUTPUT_DIR=$S/aiact-neg AIACT_FILES=ai/132_first_turn_push_aims_at_an_objective.js,ai/160_a_joined_pair_charges_with_both_units.js,rules_refactor/371_ai_still_to_act_asks_the_gate.js AIACT_DBG=$S/aiact-tools/dbg_tests.js node scripts/_aiact_dbg.cjs --skip-build 2>&1 | grep -E "PASS|FAIL"
done
rm -rf $S/aiact-neg
