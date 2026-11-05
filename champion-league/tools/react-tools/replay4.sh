#!/bin/bash
# replay.sh <base|mine> <prefix> mNN... : replay cl-shadow3 battles with the react probe.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
REPO=/home/user/warfront/.claude/worktrees/agent-aad34c53b85fa4e08
which=$1; prefix=$2; shift 2
if [ "$which" = base ]; then OUT=$S/react-base; else OUT=$S/wt-react-out3; fi
export CHROME_PATH=/opt/pw-browsers/chromium WARFRONT_OUTPUT_DIR=$OUT REACT_PROBE=$S/react-tools/react_probe.js
cd $REPO
for m in "$@"; do
  sides=$(node -e "
const r=JSON.parse(require('fs').readFileSync('$S/cl-shadow3/battle_reports/cl-s1-d1-d1-$m/report.json','utf8'));
const m=r.meta; console.log(['--a', m.sides[0].faction+'/'+m.sides[0].formation, '--b', m.sides[1].faction+'/'+m.sides[1].formation, '--seed', m.seed].join(' '));")
  echo "== $which $m $sides"
  node scripts/battle_report/react_record.cjs $sides --map CROSSROADS --no-doctrine --no-images --name $prefix-$m 2>&1 | tail -4
done
echo done-all
