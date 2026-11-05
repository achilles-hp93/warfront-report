#!/bin/bash
# Negative proofs: each new or extended test fails on a copy of the build with its change
# patched out (both engine copies in the bundle), and passes on the pristine copy.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
T=$S/blunders-tools
P=$T/p
NEG=$S/blunders-neg
mkdir -p $NEG $P
cp $S/wt-blunders-out/warfront-fantasy.html $NEG/pristine.html
export WARFRONT_OUTPUT_DIR=$NEG
cd /home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b

# name | old text (as built) | new text (patched out) | test name
w() { printf "%s" "$2" > $P/$1; }

w a_old '  var offered = effect.reset_cycle !== false
    ? activeTableEntries(effect.table).map(function(entry) { return entry.id; }) : null;
  var preferred = aiPreferredTableEntry(effect.table, unit.player, offered);'
w a_new '  var preferred = aiPreferredTableEntry(effect.table, unit.player);'
w b_old '  var boost = Math.min(aiW('"'"'OBJ_SATURATION_CAP'"'"'), 1.0 + 0.2 * -effOC);
  return boost * _aiObjectiveWinnableShare(friendOC + unitOC, enemyOC);'
w b_new '  return 1.0 + 0.2 * -effOC;'
w c_old '  if (!damage) return { expected: 0, others: 0 };'
w c_new '  if (!damage) return { expected: aiExpectedDamage(unit, target), others: 0 };'
w d_old 'function aiForcedTestValue(effect, target, player) {'
w d_new 'function aiForcedTestValue(effect, target, player) { return null;'
w e_old 'function aiAfflictionValue(effect, target, player, actor) {'
w e_new 'function aiAfflictionValue(effect, target, player, actor) { return null;'
w f_old 'function aiSeizeControlValue(effect, target, player, actor) {'
w f_new 'function aiSeizeControlValue(effect, target, player, actor) { return null;'
w g_old 'function aiForcedMoveValue(effect, target, player, actor) {'
w g_new 'function aiForcedMoveValue(effect, target, player, actor) { return null;'

run() {
  local key=$1 test=$2
  cp $NEG/pristine.html $NEG/warfront-fantasy.html
  python3 $T/patch_built.py $NEG/warfront-fantasy.html $P/${key}_old $P/${key}_new 2
  echo "--- without change $key:"
  node scripts/run_unit_tests.cjs --skip-build --test "$test" 2>&1 | grep -E "^(PASS|FAIL)"
}
run a "reopen_table_choice: the cycle resets and the player picks a new active entry; refusals; the AI scores a change only"
run b "AI: an objective is held by friends in its Objective Area or yet to move near it, not by friends that moved near it"
run c "the AI prices an ability that deals no damage by what it does, not by its user's weapons"
run d "force_test: forces a Morale Test per target with its mod, chance gate and per-event / per-round de-duplication"
run d "the AI prices an ability that deals no damage by what it does, not by its user's weapons"
run e "apply_affliction: the afflicter's plagues land with their expiry, refused when none is in play"
run f "seize_control: the enemy fights for the seizer until its round ends, keeps its true owner, then goes home"
run g "forced_move: pulls or pushes along the line by its budget; a short move costs fail_damage as Impact Damage"
echo "--- pristine:"
cp $NEG/pristine.html $NEG/warfront-fantasy.html
for t in "reopen_table_choice: the cycle resets and the player picks a new active entry; refusals; the AI scores a change only" \
  "AI: an objective is held by friends in its Objective Area or yet to move near it, not by friends that moved near it" \
  "the AI prices an ability that deals no damage by what it does, not by its user's weapons" \
  "force_test: forces a Morale Test per target with its mod, chance gate and per-event / per-round de-duplication" \
  "apply_affliction: the afflicter's plagues land with their expiry, refused when none is in play" \
  "seize_control: the enemy fights for the seizer until its round ends, keeps its true owner, then goes home" \
  "forced_move: pulls or pushes along the line by its budget; a short move costs fail_damage as Impact Damage"; do
  node scripts/run_unit_tests.cjs --skip-build --test "$t" 2>&1 | grep -E "^(PASS|FAIL)"
done
