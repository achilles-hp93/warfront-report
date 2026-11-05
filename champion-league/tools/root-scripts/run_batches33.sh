#!/bin/bash
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront
export CHROME_PATH=/opt/pw-browsers/chromium WARFRONT_OUTPUT_DIR=$S/d33-out
run() { name=$1; a=$2; b=$3; node scripts/battle_report/batch.cjs $name --a $a --b $b --games 6 --seed 700 --map CROSSROADS --parallel 3 > $S/batch33-$name.log 2>&1; echo "DONE $name exit $?"; }
run winter-host-vs-legio-xiii principality_of_novgorod/preset:rurik_army iron_imperium/preset:legatus_legion
run golden-tumen-vs-murderhost golden_khaganate/preset:genghis_army infernal_congregations/preset:hegemon_army
echo ALL_DONE
