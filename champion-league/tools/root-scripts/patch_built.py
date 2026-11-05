"""Apply [old, new] replacement pairs (a JSON file) to the built game page.

usage: python3 patch_built.py pairs.json [--reverse] [file ...]
Each old string must occur exactly once in each file. --reverse swaps old and new.
"""
import json
import sys

OUT = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-pair-out/'
args = sys.argv[1:]
reverse = '--reverse' in args
args = [a for a in args if a != '--reverse']
pairs = json.load(open(args[0]))
files = args[1:] or [OUT + 'warfront-fantasy.html']
for path in files:
    s = open(path, encoding='utf-8').read()
    for pair in pairs:
        old, new = pair[0], pair[1]
        want = pair[2] if len(pair) > 2 else 1
        if reverse:
            old, new = new, old
        n = s.count(old)
        if n != want:
            raise SystemExit('%s: %d occurrences (want %d) of %r' % (path, n, want, old[:80]))
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s)
    print('patched', path, len(pairs), 'pair(s)')
