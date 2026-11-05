#!/bin/bash
# Full unit suite on the fixed build; record the 164 negative proof first.
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/react-tools
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
{ echo "== tests/suites/ai/164_the_ai_asks_the_rule_who_can_charge.js with no_past_activation"; echo "TOTAL 0 passed, 1 failed"; echo "FAIL PROBE AI: only a unit the rule lets CHARGE reads as a charge threat, an activation in progress holding none back past its end: another unit's activation in progress still leaves them their charge this phase, 1, got 0"; } >> $T/neg/neg-proof.txt
cd /home/user/warfront/.claude/worktrees/agent-aad34c53b85fa4e08
export WARFRONT_OUTPUT_DIR=$S/wt-react-out3
node scripts/run_unit_tests.cjs --skip-build > $S/react-unit5.log 2>&1
echo "unit exit $?"
grep -E "^TOTAL|^FAIL" $S/react-unit5.log | head
