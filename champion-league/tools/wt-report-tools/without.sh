#!/bin/bash
# without.sh <test name substring> <file>... - run the battle-report tests in the exported
# copy with each named file put back to the base commit's version, print the named test's
# line, then restore the files.
IDX=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-report-idx
BASE=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-report-base
name="$1"; shift
for f in "$@"; do cp "$IDX/$f" "$IDX/$f.keep"; cp "$BASE/$f" "$IDX/$f"; done
(cd "$IDX" && node scripts/test_battle_report.cjs 2>&1 | grep -F -- "$name")
for f in "$@"; do mv "$IDX/$f.keep" "$IDX/$f"; done
