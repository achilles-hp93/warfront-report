#!/bin/bash
# usage: summary.sh <outdir> <record>   - commands record and each round's VP and objective lines
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
OUT="$1"; REC="$2"
WARFRONT_OUTPUT_DIR="$OUT" node scripts/battle_report/effects.cjs "$REC" --uses 2>/dev/null | grep -E "report.json R[0-9]+ COMMAND" | sed "s/^ *report.json//" | cut -c1-230
WARFRONT_OUTPUT_DIR="$OUT" node scripts/battle_report/digest.cjs "$REC" > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-digest-sum.txt 2>&1
grep -E "^Result|=== BATTLE ROUND|VP \+|objectives \(|primary [A-Z ]+ [0-9]+ VP|BREAK THEIR HOLD" /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-digest-sum.txt | grep -v "^  \[" | cut -c1-200
