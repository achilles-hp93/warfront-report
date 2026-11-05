#!/bin/bash
# usage: uses_all.sh <outdir> <prefix>   e.g. .../cl-out cl-s1-d1-d1-m
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
OUT="$1"; PRE="$2"
for n in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24; do
  [ -f "$OUT/battle_reports/$PRE$n/report.json" ] || continue
  WARFRONT_OUTPUT_DIR="$OUT" node scripts/battle_report/effects.cjs "$PRE$n" --uses 2>/dev/null | grep -E "report.json R[0-9]+ COMMAND" | sed "s/^ *report.json/M$n/"
done
