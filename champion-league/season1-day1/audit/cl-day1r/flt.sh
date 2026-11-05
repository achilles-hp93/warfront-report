#!/bin/bash
# print round headers + Log sections, minus noise
awk '/^=== BATTLE ROUND/{print; next} /^Log:/{inlog=1; next} /^[A-Z][a-z].*:$/ && !/^  /{inlog=0} /^Moves:|^Combat:|^Idle|^Commands and|^Passive|^Scored by|^Moves undone/{inlog=0} inlog{print}' "$1" | grep -v -E 'Movement Dice|Advances: \+|passes (COMMAND|MOVEMENT|ACTION)|\[AI\] .* - pass|Both players passed|AI vs AI mode|COMMAND PHASE - Round|Command Phase: CP|keeps a Primary|BATTLE ROUND [0-9] - BEGIN|ROUND [0-9] BEGINS|PHASE - Player . has Priority|^  \[CLEANUP\] CLEANUP PHASE'
