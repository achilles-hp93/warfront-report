#!/bin/bash
# Scratch (aibugs): replay the cited Day 1 matches with the idle probe, on one output dir.
#   replays.sh <output dir> <tag> <NN...>
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
OUT=$1; TAG=$2; shift 2
export WARFRONT_OUTPUT_DIR=$OUT
export CHROME_PATH=/opt/pw-browsers/chromium
export PROBE_TAG=$TAG
cd "$S/aibugs-tools"
for nn in "$@"; do
  case $nn in
    01) t=("Spahbed|0" "Aswaran 1|0") ;;
    08) t=("Ironthunder Vanguard 1|0" "Legatus|0") ;;
    15) t=("Michaelite Brethren 2|1" "Cantor-Preceptor|1") ;;
    20) t=("Ironthunder Vanguard 1|1" "Caesar - Divus Imperator|1") ;;
    22) t=("Sepulchre Guard 1|0" "Sepulchre Guard 2|0") ;;
  esac
  node probe_record.cjs "$nn" "${t[@]}" > "$OUT/${TAG}m$nn.log" 2>&1
  echo "done ${TAG}m$nn $?" >> "$OUT/${TAG}queue.log"
done
