#!/bin/bash
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
P=${1:-f1}
for m in 03 08 13 21; do
  echo "== $P-m$m"
  bash $S/aicmd-tools/summary.sh $S/wt-aicmd-out $P-m$m | grep -E "COMMAND" | grep -E "Double Time|Secure Objective|Scouting Order|Tactica" | cut -c1-200
  echo "-- Day 1"
  bash $S/aicmd-tools/summary.sh $S/cl-out cl-s1-d1-d1-m$m | grep -E "COMMAND" | grep -E "Double Time|Secure Objective|Scouting Order|Tactica" | cut -c1-200
done
