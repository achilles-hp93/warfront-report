#!/usr/bin/env python3
# Scratch (aiact): write a copy of the built page with one change undone (both copies
# of the engine), for the proof that a test fails without it.
#   negpatch.py <which> <out dir>
import os, sys
S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad'
SRC = S + '/wt-aiact-out/warfront-fantasy.html'
PATCHES = {
    # item 1: the push is no longer priced against the walk and its actions
    'push_gate': [("  if (!(worth > _aiChargeFloorGround(unit, normalPick))) return { shouldAdvance: false };\n", "")],
    # items 1 and 2: the moving unit alone, not its footprint
    'footprint': [("  return footprintMembers(unit).reduce(function(sum, member) {\n    if (kind === 'charge')",
                   "  return [unit].reduce(function(sum, member) {\n    if (kind === 'charge')")],
    # item 3: the old hand check in the non-attack branch
    'hand_check': [("  return aiAsOwnActivation(unit, function() { return _aiUnitMayActOtherwise(unit); });",
                    "  return (unit.ap || 0) > 0 && !unit.attacked && !unit.usedAbilityThisPhase && !unit.usedAction;")],
}
which, out = sys.argv[1], sys.argv[2]
html = open(SRC, encoding='utf-8').read()
for old, new in PATCHES[which]:
    n = html.count(old)
    assert n == 2, (which, n)
    html = html.replace(old, new)
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'warfront-fantasy.html'), 'w', encoding='utf-8').write(html)
print(which, 'patched both copies ->', out)
