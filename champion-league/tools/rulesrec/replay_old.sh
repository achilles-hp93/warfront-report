#!/bin/bash
# Scratch: replay check-run matches on the check run's own build (rulesrec-old links to
# cl-shadow's build) with this worktree's recorder scripts, so only the recorder differs.
#   replay_old.sh NN [NN...]
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
WT=/home/user/warfront/.claude/worktrees/agent-a55772a5afa7975a8
export WARFRONT_OUTPUT_DIR=$S/rulesrec-old
export CHROME_PATH=/opt/pw-browsers/chromium
for nn in "$@"; do
  line=$(node -e "const s=require('$S/cl-shadow/tournaments/cl-s1/state.json'); const m=s.days[0].matches.find(m=>m.id==='D1-M$nn'); console.log([m.a.faction+'/'+m.a.formation, m.b.faction+'/'+m.b.formation, m.seed].join(' '))")
  set -- $line
  node $WT/scripts/battle_report/record.cjs --a "$1" --b "$2" --seed "$3" --map CROSSROADS --no-doctrine --no-images --name rulesrec-old-m$nn > $S/rulesrec/old-m$nn.log 2>&1
  echo "done m$nn $?" >> $S/rulesrec/old-queue.log
done
