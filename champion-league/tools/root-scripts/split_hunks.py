"""Keep only the chosen hunks (1-based, in order across files) of a unified diff.
usage: split_hunks.py in.patch out.patch 1,4,5
Hunk line counts are unchanged, so later hunks' offsets need no fix for `git apply`
(it tolerates offset drift)."""
import sys
src, out, keep = sys.argv[1], sys.argv[2], set(int(x) for x in sys.argv[3].split(','))
lines = open(src).read().split('\n')
result, header, hunk, n = [], [], None, 0
files = []
cur = None
for line in lines:
    if line.startswith('diff --git'):
        cur = {'header': [line], 'hunks': []}
        files.append(cur)
    elif line.startswith('@@'):
        n += 1
        cur['hunks'].append({'n': n, 'lines': [line]})
    elif cur is not None and cur['hunks']:
        cur['hunks'][-1]['lines'].append(line)
    elif cur is not None:
        cur['header'].append(line)
for f in files:
    kept = [h for h in f['hunks'] if h['n'] in keep]
    if not kept:
        continue
    result.extend(f['header'])
    for h in kept:
        body = h['lines']
        while body and body[-1] == '' and h is not f['hunks'][-1]:
            body = body[:-1]
        result.extend(body)
text = '\n'.join(result)
if not text.endswith('\n'):
    text += '\n'
open(out, 'w').write(text)
print('kept', sorted(keep))
