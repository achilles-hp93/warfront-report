#!/bin/bash
# usage: batch_m08.sh <outdir> <prefix> - D1-M08's armies on four more seeds (plain record.cjs).
cd /home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
export WARFRONT_OUTPUT_DIR="$1" CHROME_PATH=/opt/pw-browsers/chromium
for k in 1 2 3 4; do
  seed=$((460703108 + k))
  node scripts/battle_report/record.cjs --a iron_imperium/preset:legatus_legion --b infernal_congregations/preset:chairman_army --seed $seed --map CROSSROADS --no-doctrine --no-images --name "$2-s$k" 2>&1 | grep -E "winner|wrote|Error|rror:" | head -3
done
