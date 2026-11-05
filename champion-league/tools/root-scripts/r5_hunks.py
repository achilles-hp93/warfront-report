import sys, re
# usage: r5_hunks.py <diff file> <out file> <keep regex>
# Keep the hunks of a one-file unified diff whose added or removed lines match the regex.
src, out, pat = sys.argv[1], sys.argv[2], re.compile(sys.argv[3])
lines = open(src, encoding='utf-8').read().split('\n')
head, hunks, cur = [], [], None
for ln in lines:
    if ln.startswith('@@'):
        cur = [ln]; hunks.append(cur)
    elif cur is None:
        head.append(ln)
    else:
        cur.append(ln)
kept = [h for h in hunks if any(pat.search(l) for l in h[1:] if l[:1] in '+-')]
print('kept %d of %d hunks' % (len(kept), len(hunks)))
text = '\n'.join(head + [l for h in kept for l in h])
if not text.endswith('\n'):
    text += '\n'
open(out, 'w', encoding='utf-8').write(text)
