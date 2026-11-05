#!/bin/bash
# batch.sh <outdir> <prefix> [match numbers...]
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
OUT=$1; PFX=$2; shift 2
cd /home/user/warfront/.claude/worktrees/cl-d1-ai-move
for m in "$@"; do
  line=$(python3 -c "
import json
s=json.load(open('$T/cl-out/tournaments/cl-s1/state.json'))
x=s['days'][0]['matches'][$m-1]
print(x['a']['faction']+'/'+x['a']['formation'], x['b']['faction']+'/'+x['b']['formation'], x['seed'])")
  set -- $line
  name=$(printf "%s-m%02d" $PFX $m)
  echo "=== $name $line"
  WARFRONT_OUTPUT_DIR=$OUT CHROME_PATH=/opt/pw-browsers/chromium timeout 2400 node $T/aimove-tools/probe_record.cjs --a $1 --b $2 --seed $3 --map CROSSROADS --no-doctrine --name $name --probe $T/aimove-tools/move_probe.js --probe-args '{}' 2>&1 | grep -E "winner|Error|error|page errors" 
done
echo BATCH-DONE
