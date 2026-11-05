#!/bin/bash
# Round 1 what-ifs with the worktree's final code (the phase-gate and DoT files swapped in too).
export EXTRA_FILES=combat/status_dot.js,ai/movement/objective_survival.js,ai/movement/melee_threat.js,ai/movement/charge_value.js
bash /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools/r1_chain.sh s4 "$@"
