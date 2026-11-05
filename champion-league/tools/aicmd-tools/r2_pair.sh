#!/bin/bash
# usage: r2_pair.sh <match> - Rounds 1-2 what-ifs: the worktree's code, then the phase-gate patch
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
M="$1"
STATE=$S/cl-out/tournaments/cl-s1/state.json
ARGS=$(python3 -c "
import json,sys
d=json.load(open('$STATE'))
m=[x for x in d['days'][0]['matches'] if x['id']=='D1-M$M'][0]
print('--a %s/%s --b %s/%s --seed %s' % (m['a']['faction'], m['a']['formation'], m['b']['faction'], m['b']['formation'], m['seed']))
")
export WARFRONT_OUTPUT_DIR=$S/wt-aicmd-base CHROME_PATH=/opt/pw-browsers/chromium EXTRA_PAGE=page_r2.js
export EXTRA_FILES=combat/status_dot.js,ai/movement/objective_survival.js,ai/movement/melee_threat.js,ai/movement/charge_value.js
NEWSRC_REPO=/home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 node $S/aicmd-tools/record_spot.cjs /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 $ARGS --map CROSSROADS --no-doctrine --no-images --name "g0-m$M" > $S/aicmd-g0-m$M.log 2>&1
echo "g0: $?"
NEWSRC_REPO=$S/aicmd-newsrc2 node $S/aicmd-tools/record_spot.cjs /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989 $ARGS --map CROSSROADS --no-doctrine --no-images --name "g1-m$M" > $S/aicmd-g1-m$M.log 2>&1
echo "g1: $?"
