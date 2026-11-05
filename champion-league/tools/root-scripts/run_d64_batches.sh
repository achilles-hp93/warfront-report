#!/bin/bash
cd /home/user/warfront
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/d64-out CHROME_PATH=/opt/pw-browsers/chromium
for pair in "longwu-vs-krakow polish_lithuanian_ruthenian_commonwealth/preset:kosciuszko_army" "longwu-vs-legion iron_imperium/preset:legatus_legion" "longwu-vs-spahbed atashid_empire/preset:spahbed_host" "longwu-vs-genghis golden_khaganate/preset:genghis_army"; do
  set -- $pair
  node scripts/battle_report/batch.cjs $1 --a jade_mandate/preset:five_banner_army --b $2 --games 6 --seed 1300     --map ACROPOLIS --map CROSSROADS --map "TRIPLE HILLS" --parallel 3 --resume > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/b64-$1.log 2>&1
  echo "BATCH $1 done rc=$?"
done
