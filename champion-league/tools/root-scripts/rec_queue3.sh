#!/bin/bash
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
W=/home/user/warfront/.claude/worktrees/cl-d1-report
pre() { # pre <name> <a> <b> <seed> [--live]
  cd $W && WARFRONT_OUTPUT_DIR=$S/rep-out-pre CHROME_PATH=/opt/pw-browsers/chromium timeout 1800 node scripts/battle_report/record.cjs --a "$2" --b "$3" --seed "$4" --map CROSSROADS --no-doctrine --no-images --name "$1" $5 > $S/rec-$1.log 2>&1
  echo "$1 exit $?" >> $S/rec-done.log
}
pre p-m21 covenant_of_new_jerusalem/preset:brazen_tower_battery atashid_empire/preset:flamebringer_immortals 460703121
pre p-m22 covenant_of_new_jerusalem/preset:soudarion_cortege caliphate_of_the_two_sanctuaries/preset:alembic_brigade 460703122
pre p-m11 euskal_herria/preset:zumalakarregi_army infernal_congregations/preset:plague_monarch_army 460703111
mkdir -p $S/rep-out-pre/battle_reports/p-m09/live; for n in 0 1 2 3 4 5 6 7 8 9; do touch $S/rep-out-pre/battle_reports/p-m09/live/go-$n; done
pre p-m09 british_liberation_front/preset:merlin_army grand_duchy_of_albion/preset:cosan_si_host 460703109 --live
# The capped M02 with the base recorder (the scoring record before item 12).
cd $S/base && WARFRONT_OUTPUT_DIR=$S/rep-out CHROME_PATH=/opt/pw-browsers/chromium timeout 1800 node scripts/battle_report/record.cjs --a iron_imperium/preset:armoured_cohort --b runeforge_directorate/preset:magdeburg_warhost --seed 460703102 --map CROSSROADS --no-doctrine --no-images --name base-v5-m02 > $S/rec-base-v5-m02.log 2>&1
echo "base-v5-m02 exit $?" >> $S/rec-done.log
echo QUEUE3 DONE >> $S/rec-done.log
