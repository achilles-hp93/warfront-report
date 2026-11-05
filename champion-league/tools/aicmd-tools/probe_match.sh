#!/bin/bash
# usage: probe_match.sh <outdir> <name-prefix> <match number e.g. 03> [plain]
# Replays a Day 1 match from its seed, with the command probe unless "plain".
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
OUT="$1"; PRE="$2"; M="$3"; MODE="$4"
STATE=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/tournaments/cl-s1/state.json
ARGS=$(python3 -c "
import json,sys
d=json.load(open('$STATE'))
m=[x for x in d['days'][0]['matches'] if x['id']=='D1-M$M'][0]
print('--a %s/%s --b %s/%s --seed %s' % (m['a']['faction'], m['a']['formation'], m['b']['faction'], m['b']['formation'], m['seed']))
")
export WARFRONT_OUTPUT_DIR="$OUT" CHROME_PATH=/opt/pw-browsers/chromium
if [ "$MODE" = "plain" ]; then
  node scripts/battle_report/record.cjs $ARGS --map CROSSROADS --no-doctrine --no-images --name "$PRE-m$M"
else
  node /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools/record_probe.cjs /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 $ARGS --map CROSSROADS --no-doctrine --no-images --name "$PRE-m$M"
fi
