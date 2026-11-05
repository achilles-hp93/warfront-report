#!/bin/bash
# Scratch (aiact): full replays of Day 1 battles on my build, as the brief's record.cjs line.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090
export WARFRONT_OUTPUT_DIR=$S/wt-aiact-out CHROME_PATH=/opt/pw-browsers/chromium
for nn in "$@"; do
  side=$(node -e "const d=require('$S/cl-shadow2/tournaments/cl-s1/state.json'); const m=d.days[0].matches.find(x=>x.id==='D1-M$nn'); console.log([m.a.faction+'/'+m.a.formation, m.b.faction+'/'+m.b.formation, m.seed].join(' '))")
  set -- $side
  timeout 3000 node scripts/battle_report/record.cjs --a $1 --b $2 --seed $3 --map CROSSROADS --no-doctrine --no-images --name aiact-m$nn > $S/aiact-full-m$nn.log 2>&1
  echo "done m$nn $?" >> $S/aiact-full-queue.log
done
echo "all done" >> $S/aiact-full-queue.log
