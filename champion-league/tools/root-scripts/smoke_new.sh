cd /home/user/warfront
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
run() { CHROME_PATH=/opt/pw-browsers/chromium WARFRONT_OUTPUT_DIR=$S/d40-out node scripts/battle_report/batch.cjs "smoke-$1" --a "$2" --b "$3" --games 1 --seed 900 --map CROSSROADS --parallel 1 > $S/smoke-$1.log 2>&1; echo "$1: $(grep -E '^game 1/1|error|Error' $S/smoke-$1.log | head -2)"; }
run hayk kingdom_of_hayk/preset:andranik_army iron_imperium/preset:legatus_legion &
run euskal euskal_herria/preset:zumalakarregi_army church_of_the_beast/preset:herald_army &
run kalevan kalevan_kansa/preset:vainamoinen_army atashid_empire/preset:spahbed_host &
wait
run cossack great_cossack_host/preset:sirko_army principality_of_novgorod/preset:rurik_army &
run tang jade_mandate/preset:five_banner_army empire_of_nihon/preset:taichou_army &
run akkadi mat_akkadi/preset:gilgamesh_army duat_dominion/preset:ramesses_army &
wait
run plr polish_lithuanian_ruthenian_commonwealth/preset:kosciuszko_army golden_khaganate/preset:genghis_army
echo ALLDONE
