# hunks.py list <diff file>          - print each hunk's index and first changed lines
# hunks.py pick <diff file> i,j,...  - write a patch of the file header plus those hunks to stdout
import sys


def parse(path):
    lines = open(path).read().split('\n')
    head, hunks, cur = [], [], None
    for ln in lines:
        if ln.startswith('@@'):
            cur = [ln]
            hunks.append(cur)
        elif cur is None:
            head.append(ln)
        else:
            cur.append(ln)
    if hunks and hunks[-1] and hunks[-1][-1] == '':
        hunks[-1] = hunks[-1][:-1]
    return head, hunks


mode, path = sys.argv[1], sys.argv[2]
head, hunks = parse(path)
if mode == 'list':
    for i, h in enumerate(hunks):
        ch = [l for l in h[1:] if l[:1] in '+-'][:3]
        print(i, h[0][:60], '|', ' || '.join(c[:90] for c in ch))
else:
    pick = [int(x) for x in sys.argv[3].split(',')]
    out = head + [l for i in pick for l in hunks[i]]
    sys.stdout.write('\n'.join(out) + '\n')
