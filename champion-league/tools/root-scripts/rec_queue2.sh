#!/bin/bash
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
$S/rec_one.sh v5-m02 iron_imperium/preset:armoured_cohort runeforge_directorate/preset:magdeburg_warhost 460703102
$S/rec_one.sh v5-m21 covenant_of_new_jerusalem/preset:brazen_tower_battery atashid_empire/preset:flamebringer_immortals 460703121
$S/rec_one.sh v5-m22 covenant_of_new_jerusalem/preset:soudarion_cortege caliphate_of_the_two_sanctuaries/preset:alembic_brigade 460703122
$S/rec_one.sh v5-m11 euskal_herria/preset:zumalakarregi_army infernal_congregations/preset:plague_monarch_army 460703111
$S/rec_one.sh v5-m09 british_liberation_front/preset:merlin_army grand_duchy_of_albion/preset:cosan_si_host 460703109
echo QUEUE2 DONE >> $S/rec-done.log
