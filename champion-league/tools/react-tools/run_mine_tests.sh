#!/bin/bash
# Run the extended tests by name against the built page.
cd /home/user/warfront/.claude/worktrees/agent-aad34c53b85fa4e08
export WARFRONT_OUTPUT_DIR=${OUT:-/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-react-out2}
while IFS= read -r name; do
  [ -z "$name" ] && continue
  node scripts/run_unit_tests.cjs --skip-build --test "$name" 2>&1 | grep -E "^(PASS|FAIL|TOTAL)|Error" | head -3
done <<'EOF'
AI: a CHARGE is priced as an attack - the shot it gives up, a target that Falls Back, the fight beside it, the Reactions it draws
A granted move goes where the unit's own move would, toward the far square it walks to; a granted CHARGE is weighed as a Charge
A move order is worth the square it reaches, nothing when staying is best, and is played to that square
grant_move: queued, fall back, charge, choice, once-per-round, staged step and immediate move-order shapes, each through its consumer
Countercharge: the AI spends it when the exchange is worth it - the charge it shields against the fight it walks into and the Reactions its own Charge draws
AI: a shot into a melee is worth its Friendly Fire roll, less the stray on its own unit and the shots it draws back
AI: an Overwatch with a FREE weapon pays for the shot it gives up, and every Overwatch for the shots it draws back
Attack events: after_attack names its target, after_damaging fires for the attacker with the damaged unit and the attack kind, and what an attack would draw is asked spending nothing
offer_ranged_attack: optional event attack, held use, zero APt, legality and round reset
EOF
echo tests-done
