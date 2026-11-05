#!/bin/bash
# replay.sh <mNN>... - replay Champion League Day 1 battles on the base build with this
# worktree's report tools, into wt-report-out (never cl-out). Two at a time.
WT=/home/user/warfront/.claude/worktrees/agent-ab65de78712311dff
SC=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
export WARFRONT_OUTPUT_DIR=$SC/wt-report-out
export CHROME_PATH=/opt/pw-browsers/chromium
declare -A A B
A[m01]=atashid_empire/preset:spahbed_host;            B[m01]=infernal_congregations/preset:pontifex_procession
A[m04]=iron_imperium/preset:artificer_forge;          B[m04]=british_liberation_front/preset:caerfyrddin_fencibles
A[m06]=polish_lithuanian_ruthenian_commonwealth/preset:kosciuszko_army; B[m06]=covenant_of_new_jerusalem/preset:true_cross_host
A[m07]=caliphate_of_the_two_sanctuaries/preset:saladin_army; B[m07]=church_of_the_beast/preset:herald_army
A[m08]=iron_imperium/preset:legatus_legion;           B[m08]=infernal_congregations/preset:chairman_army
A[m14]=infernal_congregations/preset:veiled_court;    B[m14]=mat_akkadi/preset:gilgamesh_army
A[m18]=infernal_congregations/preset:hegemon_army;    B[m18]=empire_of_nihon/preset:taichou_army
A[m20]=covenant_of_new_jerusalem/preset:popinjay_guild; B[m20]=iron_imperium/preset:alea_iacta
A[m21]=covenant_of_new_jerusalem/preset:brazen_tower_battery; B[m21]=atashid_empire/preset:flamebringer_immortals
A[m24]=iron_imperium/preset:scorpion_shields;         B[m24]=covenant_of_new_jerusalem/preset:penitent_crusade
run() {
  local m=$1 n=${1#m}
  local seed=$((460703100 + 10#$n))
  for try in 1 2 3; do
    (cd $WT && node scripts/battle_report/record.cjs --a ${A[$m]} --b ${B[$m]} --seed $seed --map CROSSROADS --no-doctrine --no-images --name rp-$m) > $SC/wt-report-out/rp-$m.log 2>&1
    grep -q "^wrote" $SC/wt-report-out/rp-$m.log && break
    echo "$m attempt $try failed: $(head -1 $SC/wt-report-out/rp-$m.log | cut -c1-120)"
  done
  echo "$m done: $(tail -4 $SC/wt-report-out/rp-$m.log | head -1)"
}
running=0
for m in "$@"; do
  run $m &
  running=$((running + 1))
  if [ $running -ge ${PAR:-1} ]; then wait -n; running=$((running - 1)); fi
done
wait
echo ALL DONE
