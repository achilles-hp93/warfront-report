#!/usr/bin/env python3
# Scratch (aiact): the new reading functions, cut from the worktree's sources, to evaluate
# in an older built page (cl-shadow2) so its recorded boards can be priced without
# changing a decision there.
import re, sys
W = '/home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090/engine/modules/'

def fn(path, name):
    src = open(W + path).read()
    m = re.search(r'^function ' + re.escape(name) + r'\(', src, re.M)
    assert m, name
    i = m.start()
    # to the first line that is exactly "}" after it
    j = src.index('\n}\n', i) + 3
    return src[i:j]

parts = [
    open(W + 'ai/movement/forgone_actions.js').read(),
    fn('movement/default_actions.js', '_markFootprintAdvanced'),
    fn('movement/default_actions.js', 'withFootprintAdvanced'),
    fn('ai/action/choose.js', 'aiAsOwnActivation'),
    fn('ai/action/choose.js', 'aiUnitBestAction'),
    fn('ai/movement/advance_plan.js', 'aiAdvanceWorth'),
    fn('ai/movement/advance_plan.js', 'aiAdvanceRollSquares'),
]
open(sys.argv[1], 'w').write('\n'.join(parts) + '\n')
print('wrote', sys.argv[1])
