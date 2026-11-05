#!/bin/bash
# Negative proofs: each extended test against the built page with the change patched out.
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/react-tools
B=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-react-out2
export REPO=/home/user/warfront/.claude/worktrees/agent-aad34c53b85fa4e08
cd $REPO
node $T/neg/mk_patches.cjs
run() { echo "== $1 with $2"; ONLY="$3" node $T/probe_test.cjs $B $1 $T/neg/$2.json 2>&1 | grep -v "^    at"; }
run tests/suites/ai/187_a_charge_is_priced_as_an_attack.js no_reactions
run tests/suites/reaction_commands/050_countercharge.js no_reactions "the AI spends it"
run tests/suites/ai/173_a_granted_move_follows_the_units_own_choice.js no_routing
run tests/suites/ai/173_a_granted_move_follows_the_units_own_choice.js no_reactions
run tests/suites/ai/167_a_move_order_is_worth_the_square_it_reaches.js no_routing
run tests/suites/ops/grant_move.js no_routing
run tests/suites/ops/grant_move.js no_reactions
run tests/suites/ai/165_a_shot_into_melee_prices_its_stray.js no_drawn
run tests/suites/ai/255_an_overwatch_with_a_free_weapon_pays_for_the_shot_it_gives_up.js no_drawn
run tests/suites/ability_runtime/240_attack_events_carry_the_target.js no_peek "what an attack would draw"
echo done
