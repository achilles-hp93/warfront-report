#!/bin/bash
# Scratch (aiact): Round 1 replays on a build dir ($1), output prefix ($2), matches ($3...).
OUT=$1; PFX=$2; shift 2
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090
export WARFRONT_OUTPUT_DIR=$OUT CHROME_PATH=/opt/pw-browsers/chromium
for nn in "$@"; do
  timeout 1500 node $S/aiact-tools/probe.cjs --nn $nn --rounds 1 --out $S/aiact-r1/$PFX-m$nn.json --probe $S/aiact-tools/page_push_probe.js > $S/aiact-r1/$PFX-m$nn.log 2>&1
  echo "done m$nn $?" >> $S/aiact-r1/$PFX-queue.log
done
echo "all done" >> $S/aiact-r1/$PFX-queue.log
