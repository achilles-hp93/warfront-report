#!/bin/bash
# 233 (more MOVE) and 235's charge case on the final bundle, each with its fix patched out.
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools
echo "== 233 without the move choice"; bash $T/prove_fail.sh $T/old_dt.js tests/suites/ai/233_more_move_is_worth_the_move_the_unit_makes.js "AI: more MOVE is worth*"
echo "== 235 without the charge stake"; bash $T/prove_fail.sh $T/old_chargestake.js tests/suites/ai/235_a_move_off_held_ground_pays_for_the_vp_at_stake.js "AI presence: a charge*||AI presence: a move off held ground*"
