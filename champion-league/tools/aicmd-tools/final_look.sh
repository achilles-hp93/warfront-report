#!/bin/bash
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
echo "M08 batch, Day 1 build:"; grep winner $S/aicmd-bm08-base.log
echo "M08 batch, final build:"; grep winner $S/aicmd-bm08-new.log
echo "== f3-m10"
bash $S/aicmd-tools/summary.sh $S/wt-aicmd-out f3-m10 | grep -E "Result|VP \+|Double|Secure|Scouting" | cut -c1-210
echo "== Day 1 M10"
bash $S/aicmd-tools/summary.sh $S/cl-out cl-s1-d1-d1-m10 | grep -E "Result|Double|Secure|Scouting" | cut -c1-210
for m in 21 22 08 05 15; do echo "== s4-m$m R1"; python3 $S/aicmd-tools/show_cands.py $S/wt-aicmd-base/battle_reports/s4-m$m/report.json 1 | grep -v "      DT" | cut -c1-260; done
