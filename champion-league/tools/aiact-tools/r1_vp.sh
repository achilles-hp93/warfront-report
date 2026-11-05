#!/bin/bash
# Scratch (aiact): Round 1 VP per side, before (cl-shadow2 record) and after (my R1 replay).
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090
for n in "$@"; do
  b=$(WARFRONT_OUTPUT_DIR=$S/cl-shadow2 node scripts/battle_report/digest.cjs cl-s1-d1-d1-m$n 2>/dev/null | awk '/=== BATTLE ROUND 1 ===/{f=1;next} /=== BATTLE ROUND 2/{f=0} f && /: VP \+/{print}' | sed -E 's/^([AB]):[^:]*: VP \+([0-9]+) \(obj ([0-9]+).*/\1 +\2 (obj \3)/' | tr '\n' ' ')
  a=$(node -e "const o=require('$S/aiact-r1/new-m$n.json'); console.log(JSON.stringify(o.vp))")
  echo "m$n before: $b | after (A,B): $a"
done
