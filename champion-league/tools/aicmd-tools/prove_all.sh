#!/bin/bash
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools
echo "== 234 without the move check"; bash $T/prove_fail.sh $T/old_holdplan.js tests/suites/ai/234_secure_objective_and_the_move_are_one_decision.js "AI: Secure Objective is worth what it keeps*"
echo "== 234 without the hold"; bash $T/prove_fail.sh $T/old_hold.js tests/suites/ai/234_secure_objective_and_the_move_are_one_decision.js "AI: Secure Objective is worth what it keeps*"
echo "== 235 without the stake"; bash $T/prove_fail.sh $T/old_stake.js tests/suites/ai/235_a_move_off_held_ground_pays_for_the_vp_at_stake.js "AI presence: a move off held ground*"
echo "== 236 without the missions"; bash $T/prove_fail.sh $T/old_missions.js tests/suites/ai/236_a_kept_mission_counts_in_what_presence_holds.js "AI presence: a kept mission*"
echo "== 237 without the CP floor"; bash $T/prove_fail.sh $T/old_cpfloor.js tests/suites/ai/237_a_command_is_bought_only_when_worth_its_cp.js "AI: a command is a candidate only when what*"
echo "== 238 without the spot fix"; bash $T/prove_fail.sh $T/old_spot.js tests/suites/ai/238_a_scouting_order_counts_both_armies_moves.js "AI: a Scouting Order is worth the enemies only*"
