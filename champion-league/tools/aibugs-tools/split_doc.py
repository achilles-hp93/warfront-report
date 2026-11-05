#!/usr/bin/env python3
"""Split doc_all.patch into one single-hunk patch per fix (scratch, aibugs)."""
import os

here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, 'doc_all.patch')).read()
head, *hunks = s.split('\n@@')
hunks = ['@@' + h for h in hunks]
assert len(hunks) == 3, len(hunks)
for name, h in zip(['doc_push.patch', 'doc_pair.patch', 'doc_gate.patch'], hunks):
    with open(os.path.join(here, name), 'w') as f:
        f.write(head + '\n' + h + ('' if h.endswith('\n') else '\n'))
print('split', [len(h) for h in hunks])
