#!/usr/bin/env python3
"""Copy a built warfront-fantasy.html into a scratch output dir, optionally appending
scratch test JS before the last </script> and applying text replacements.
usage: patch_html.py SRC_HTML DST_DIR [--append file.js]... [--replace OLDFILE NEWFILE]..."""
import sys, os
args = sys.argv[1:]
src, dst = args[0], args[1]
appends, reps = [], []
i = 2
while i < len(args):
    if args[i] == '--append':
        appends.append(args[i+1]); i += 2
    elif args[i] == '--replace':
        reps.append((args[i+1], args[i+2])); i += 3
    else:
        raise SystemExit('bad arg ' + args[i])
s = open(src, encoding='utf-8').read()
for oldf, newf in reps:
    old = open(oldf, encoding='utf-8').read()
    new = open(newf, encoding='utf-8').read()
    n = s.count(old)
    if n < 1:
        raise SystemExit('replacement not found: ' + oldf)
    s = s.replace(old, new)
    print('replaced', oldf, n, 'times')
if appends:
    end = s.rindex('</script>')
    extra = ''.join('\n' + open(a, encoding='utf-8').read() + '\n' for a in appends)
    s = s[:end] + extra + s[end:]
os.makedirs(dst, exist_ok=True)
open(os.path.join(dst, 'warfront-fantasy.html'), 'w', encoding='utf-8').write(s)
print('wrote', os.path.join(dst, 'warfront-fantasy.html'))
