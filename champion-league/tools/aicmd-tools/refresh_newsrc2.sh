#!/bin/bash
# The phase-gate variant of the worktree's AI source: Command Phase counted as before the move.
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
W=/home/user/warfront/.claude/worktrees/agent-afeeceb19bb920989
rm -rf "$S/aicmd-newsrc2"
mkdir -p "$S/aicmd-newsrc2/engine/modules/combat"
cp -r "$W/engine/modules/ai" "$S/aicmd-newsrc2/engine/modules/ai"
cp "$W/engine/modules/combat/status_dot.js" "$S/aicmd-newsrc2/engine/modules/combat/"
M="$S/aicmd-newsrc2/engine/modules/ai/movement"
sed -i -e "s/  return G.battlePhase === 'MOVEMENT' \&\& !enemy.moved;/  return (G.battlePhase === 'COMMAND' || G.battlePhase === 'MOVEMENT') \&\& !enemy.moved;/" "$M/objective_survival.js"
sed -i -e "s/  if (G.battlePhase !== 'MOVEMENT') return -1;/  if (G.battlePhase !== 'MOVEMENT' \&\& G.battlePhase !== 'COMMAND') return -1;/" "$M/melee_threat.js"
sed -i -e "s/  return G.battlePhase === 'MOVEMENT' \&\& !target.moved \&\& !actionBlocked(target, 'fall_back');/  return (G.battlePhase === 'COMMAND' || G.battlePhase === 'MOVEMENT') \&\& !target.moved \&\& !actionBlocked(target, 'fall_back');/" "$M/charge_value.js"
grep -c "COMMAND" "$M/objective_survival.js" "$M/melee_threat.js" "$M/charge_value.js"
