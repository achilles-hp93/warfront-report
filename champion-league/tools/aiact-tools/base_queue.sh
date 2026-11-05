#!/bin/bash
# Scratch (aiact): the final price, read on the recorded boards (cl-shadow2 build, decisions unchanged).
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090
export WARFRONT_OUTPUT_DIR=$S/aiact-base CHROME_PATH=/opt/pw-browsers/chromium
for nn in "$@"; do
  timeout 1500 node $S/aiact-tools/probe.cjs --nn $nn --rounds 1 --out $S/aiact-r1/base-m$nn.json --inject $S/aiact-tools/inject_newfns.js --probe $S/aiact-tools/page_push_probe.js > $S/aiact-r1/base-m$nn.log 2>&1
  echo "done m$nn $?" >> $S/aiact-r1/base-queue.log
done
echo "all done" >> $S/aiact-r1/base-queue.log
