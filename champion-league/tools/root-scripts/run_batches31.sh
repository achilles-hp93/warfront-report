#!/bin/bash
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
cd /home/user/warfront
export CHROME_PATH=/opt/pw-browsers/chromium WARFRONT_OUTPUT_DIR=$S/d31-out
run() { name=$1; a=$2; b=$3; node scripts/battle_report/batch.cjs $name --a $a --b $b --games 6 --seed 700 --map CROSSROADS --parallel 3 > $S/batch31-$name.log 2>&1; echo "DONE $name exit $?"; }
run s2-rurik-vs-genghis principality_of_novgorod/preset:rurik_army golden_khaganate/preset:genghis_army
run s2-rurik-vs-finvarra principality_of_novgorod/preset:rurik_army grand_duchy_of_albion/preset:finvarra_army
run s2-rurik-vs-taichou principality_of_novgorod/preset:rurik_army empire_of_nihon/preset:taichou_army
run s2-genghis-vs-hegemon golden_khaganate/preset:genghis_army infernal_congregations/preset:hegemon_army
run s2-genghis-vs-legion golden_khaganate/preset:genghis_army iron_imperium/preset:legatus_legion
echo ALL_DONE
