#!/bin/bash
cd /home/user/warfront
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/d29-out CHROME_PATH=/opt/pw-browsers/chromium
run() { node scripts/battle_report/batch.cjs "$1" --a "$2" --b "$3" --games 6 --seed 700 --map CROSSROADS --parallel 3 > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/batch-$1.log 2>&1; echo "BATCH $1 exit $?"; }
run s2-rurik-vs-genghis principality_of_novgorod/preset:rurik_army golden_khaganate/preset:genghis_army
run s2-rurik-vs-finvarra principality_of_novgorod/preset:rurik_army grand_duchy_of_albion/preset:finvarra_army
run s2-rurik-vs-taichou principality_of_novgorod/preset:rurik_army empire_of_nihon/preset:taichou_army
run s2-genghis-vs-hegemon golden_khaganate/preset:genghis_army infernal_congregations/preset:hegemon_army
run s2-genghis-vs-legion golden_khaganate/preset:genghis_army iron_imperium/preset:legatus_legion
echo ALL-DONE
