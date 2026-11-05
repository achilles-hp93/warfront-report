"""Replace text in a built bundle (every occurrence) - scratch, for test iteration and proofs.
usage: python3 patch_built.py <file> <old-file> <new-file> [expected-count]
The old/new texts are read from files so they can span lines.
"""
import sys
path, old_f, new_f = sys.argv[1:4]
want = int(sys.argv[4]) if len(sys.argv) > 4 else None
s = open(path, encoding='utf-8').read()
old = open(old_f, encoding='utf-8').read()
new = open(new_f, encoding='utf-8').read()
n = s.count(old)
if n == 0 or (want is not None and n != want):
    sys.exit(f'found {n} occurrences in {path}, wanted {want}')
open(path, 'w', encoding='utf-8').write(s.replace(old, new))
print(f'{path}: replaced {n}')
