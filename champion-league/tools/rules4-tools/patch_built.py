#!/usr/bin/env python3
"""Replace text in a built file: patch_built.py <file> <old file> <new file> [expected count]
The old and new texts are read from files (exact, no trailing newline added)."""
import sys

path, old_path, new_path = sys.argv[1:4]
want = int(sys.argv[4]) if len(sys.argv) > 4 else None
s = open(path, encoding='utf-8').read()
old = open(old_path, encoding='utf-8').read()
new = open(new_path, encoding='utf-8').read()
n = s.count(old)
if want is not None and n != want:
    sys.exit(f'{path}: found {n} occurrence(s), expected {want}')
if n == 0:
    sys.exit(f'{path}: not found')
open(path, 'w', encoding='utf-8').write(s.replace(old, new))
print(f'{path}: replaced {n}')
