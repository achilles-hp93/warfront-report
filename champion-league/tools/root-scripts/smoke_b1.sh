cd /home/user/warfront
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
run() { CHROME_PATH=/opt/pw-browsers/chromium WARFRONT_OUTPUT_DIR=$S/d41-out node scripts/battle_report/batch.cjs "sm41-$1" --a "$2" --b "$3" --games 1 --seed 901 --map CROSSROADS --parallel 1 > $S/sm41-$1.log 2>&1; echo "$1: $(grep -E '^game 1/1|rror' $S/sm41-$1.log | head -3)"; }
run procession infernal_congregations/preset:pontifex_procession iron_imperium/preset:legatus_legion &
run belfry covenant_of_new_jerusalem/preset:brazen_tower_battery church_of_the_beast/preset:herald_army &
run tumen golden_khaganate/preset:genghis_army atashid_empire/preset:spahbed_host &
wait
run cohort iron_imperium/preset:armoured_cohort caliphate_of_the_two_sanctuaries/preset:saladin_army &
run camelot british_liberation_front/preset:merlin_army grand_duchy_of_albion/preset:finvarra_army &
run march duat_dominion/preset:ramesses_army empire_of_nihon/preset:taichou_army &
wait
run longwu jade_mandate/preset:five_banner_army runeforge_directorate/preset:valkyrie_army &
run murderhost infernal_congregations/preset:hegemon_army panhellenic_league/preset:heron_army &
wait
echo ALLDONE
