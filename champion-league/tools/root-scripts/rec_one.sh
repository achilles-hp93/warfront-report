#!/bin/bash
# rec_one.sh <name> <a> <b> <seed>
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/cl-d1-report
WARFRONT_OUTPUT_DIR=$S/rep-out CHROME_PATH=/opt/pw-browsers/chromium timeout 1800 node scripts/battle_report/record.cjs --a "$2" --b "$3" --seed "$4" --map CROSSROADS --no-doctrine --no-images --name "$1" > $S/rec-$1.log 2>&1
echo "$1 exit $?" >> $S/rec-done.log
