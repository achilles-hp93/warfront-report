#!/bin/bash
# usage: whatif_match.sh <name-prefix> <match number e.g. 03>
# Replays a Day 1 match from its seed on the Day 1 build (wt-aicmd-base), asking the
# worktree's new AI code what it would decide at each command phase and objective leave.
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
PRE="$1"; M="$2"
STATE=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/tournaments/cl-s1/state.json
ARGS=$(python3 -c "
import json,sys
d=json.load(open('$STATE'))
m=[x for x in d['days'][0]['matches'] if x['id']=='D1-M$M'][0]
print('--a %s/%s --b %s/%s --seed %s' % (m['a']['faction'], m['a']['formation'], m['b']['faction'], m['b']['formation'], m['seed']))
")
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-aicmd-base CHROME_PATH=/opt/pw-browsers/chromium
export NEWSRC_REPO=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-newsrc
node /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools/record_whatif.cjs /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 $ARGS --map CROSSROADS --no-doctrine --no-images --name "$PRE-m$M"
