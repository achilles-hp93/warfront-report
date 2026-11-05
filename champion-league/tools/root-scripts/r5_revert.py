import sys, subprocess
# usage: r5_revert.py <repo> <base commit> <in html> <out html> <path>...
# Undo, in a built page, the changes since <base commit> to the named source files:
# every hunk's new text (context and added lines) is put back to its old text
# (context and removed lines), wherever the page holds it (the engine is in it twice).
repo, base, src, dst = sys.argv[1:5]
paths = sys.argv[5:]
diff = subprocess.run(['git', '-C', repo, 'diff', '-U2', base, '--'] + paths,
                      capture_output=True, text=True, check=True).stdout
s = open(src, encoding='utf-8').read()
hunks, cur, fname = [], None, None
for ln in diff.split('\n'):
    if ln.startswith('+++ '):
        fname = ln[6:]
    elif ln.startswith('@@'):
        cur = {'file': fname, 'lines': []}
        hunks.append(cur)
    elif cur is not None and ln[:1] in (' ', '+', '-') and not ln.startswith('--- '):
        cur['lines'].append(ln)
for h in hunks:
    new = '\n'.join(l[1:] for l in h['lines'] if l[0] in ' +')
    old = '\n'.join(l[1:] for l in h['lines'] if l[0] in ' -')
    n = s.count(new)
    s = s.replace(new, old)
    added = [l for l in h['lines'] if l[0] == '+']
    print('%-50s %d occurrence(s), %d added line(s): %s' % (h['file'], n, len(added), (added[0][:70] if added else '')))
open(dst, 'w', encoding='utf-8').write(s)
