#!/bin/bash
# Whole-battle what-ifs with the worktree's final code (every changed file swapped in),
# after the Round 1 chain has finished.
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
while pgrep -f "r1_chain.sh s4" > /dev/null; do sleep 20; done
export EXTRA_FILES=combat/status_dot.js,ai/movement/objective_survival.js,ai/movement/melee_threat.js,ai/movement/charge_value.js
for m in "$@"; do
  bash $T/spot_match.sh w4 "$m" page_none.js > $S/aicmd-w4-m$m.log 2>&1
  echo "m$m: $?"
done
