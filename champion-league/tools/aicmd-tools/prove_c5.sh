#!/bin/bash
# The fifth change's tests: with the fix, with the phase gate patched out, with the DoT patched out.
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools
FIX=engine/modules/combat/status_dot.js,engine/modules/ai/movement/move_choice.js,engine/modules/ai/movement/melee_threat.js,engine/modules/ai/movement/charge_value.js,engine/modules/ai/movement/objective_survival.js
TESTS=tests/suites/ai/181_an_objective_is_worth_as_often_as_the_unit_lives.js,tests/suites/ai/187_a_charge_is_priced_as_an_attack.js
NAMES="AI: an objective is worth as often as the unit lives to score it||AI: a charge that can land counts toward whether the unit lives to score||AI: a CHARGE is priced as an attack*"
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-aicmd-out NAMES
for variant in "with the fix:$FIX,$TESTS" "phase gate patched out:$FIX,$T/old_phasegate.js,$TESTS" "DoT patched out:$FIX,$T/old_survival_dot.js,$TESTS"; do
  echo "== ${variant%%:*}"
  EXTRA="${variant#*:}" timeout 900 node $T/unit_extra.cjs /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 --skip-build 2>&1 | grep -E "^TOTAL|^FAIL"
done
