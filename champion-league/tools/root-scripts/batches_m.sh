#!/bin/bash
# The five matchups the user asked for (2026-10-27): 6 battles each, maps spread.
cd /home/user/warfront
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
export CHROME_PATH=/opt/pw-browsers/chromium WARFRONT_OUTPUT_DIR=$S/d42-out
P=${PAR:-3}
b() { local name=$1; shift; echo "START $name $(date +%H:%M:%S)"; node scripts/battle_report/batch.cjs "$name" "$@" --games 6 --parallel $P > $S/batch-$name.log 2>&1; echo "DONE $name rc=$? $(date +%H:%M:%S)"; }
b procession-vs-masis --a infernal_congregations/preset:pontifex_procession --b kingdom_of_hayk/preset:andranik_army --seed 1100 --map ACROPOLIS --map CROSSROADS --map "TRIPLE HILLS"
b uruk-vs-sampo --a mat_akkadi/preset:gilgamesh_army --b kalevan_kansa/preset:vainamoinen_army --seed 1200 --map "TWIN LAKES"
b longwu-vs-krakow --a jade_mandate/preset:five_banner_army --b polish_lithuanian_ruthenian_commonwealth/preset:kosciuszko_army --seed 1300 --map ACROPOLIS --map CROSSROADS --map "TRIPLE HILLS"
b bailiffs-vs-etna --a infernal_congregations/preset:chairman_army --b iron_imperium/preset:artificer_forge --seed 1400 --map ACROPOLIS --map CROSSROADS --map "TWIN LAKES"
b lightbearers-vs-protectores --a infernal_congregations/preset:dawn_king_army --b iron_imperium/preset:palatine_guard --seed 1500 --map CROSSROADS --map "TRIPLE HILLS" --map "TWIN LAKES"
echo ALLDONE
