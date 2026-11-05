#!/bin/bash
# usage: round.sh <outdir> <record> <round> [extra grep]
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
OUT="$1"; REC="$2"; R="$3"; N=$((R+1))
WARFRONT_OUTPUT_DIR="$OUT" node scripts/battle_report/digest.cjs "$REC" > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-digest-tmp.txt 2>&1
grep "^Primary" /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-digest-tmp.txt | cut -c1-140
sed -n "/=== BATTLE ROUND $R ===/,/=== BATTLE ROUND $N ===/p" /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-digest-tmp.txt | grep -E "VP \+|MOVEMENT\] [AB]|ACTION\] [AB].*->.*[0-9],[0-9]|objectives \(|primary|COMMAND\] [AB]|undone|BATTLE ROUND|DESTROYED|Fall Back${4:+|$4}" | grep -v "Overwatch\|magic"
