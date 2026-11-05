# Compare Day 1 runs: digests/effects text in S/cmp/<run>-dig-mNN.txt and <run>-eff-mNN.txt,
# results from S/<run>/tournaments/cl-s1/state.json.  python3 agg.py cl-shadow cl-shadow2
import re, sys, json, collections, os
S = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(S)

def agg(d):
    cmd = collections.defaultdict(lambda: [0, 0])
    nostrike = idle = 0
    for i in range(1, 25):
        eff = open('%s/%s-eff-m%02d.txt' % (S, d, i)).read()
        for m in re.finditer(r'\] (.+?) \((command|reaction|ability|magic|miracle|antiphon|[a-z ]+)\): (\d+) uses, (\d+) bought nothing; (\d+) CP', eff):
            if m.group(2) in ('command', 'reaction'):
                c = cmd[m.group(1)]; c[0] += int(m.group(3)); c[1] += int(m.group(4))
        dig = open('%s/%s-dig-m%02d.txt' % (S, d, i)).read()
        nostrike += len(re.findall(r'destroyed - no strike', dig))
        for m in re.finditer(r'inaction [\d.]+ \((\d+) idle, (\d+) after moving, (\d+) Overwatch\)', dig):
            idle += int(m.group(1))
    st = json.load(open('%s/%s/tournaments/cl-s1/state.json' % (ROOT, d)))
    res = {m['id']: m.get('result') for m in st['days'][0]['matches']}
    return cmd, nostrike, idle, res

runs = sys.argv[1:] or ['cl-shadow', 'cl-shadow2']
data = {d: agg(d) for d in runs}
for d in runs:
    cmd, ns, idle, res = data[d]
    tot = [sum(v[0] for v in cmd.values()), sum(v[1] for v in cmd.values())]
    margins = [abs(r['vp'][0] - r['vp'][1]) for r in res.values() if r]
    draws = sum(1 for r in res.values() if r and (r.get('winner') in (-1, None)) and r.get('reason') == 'VP_DRAW')
    rounds = [r['round'] for r in res.values() if r]
    print('== %s: melee no-strike %d | idle unit-rounds %d | commands %d, bought nothing %d | avg margin %.1f | draws %d | avg rounds %.2f | errors %d'
          % (d, ns, idle, tot[0], tot[1], sum(margins) / max(1, len(margins)), draws, sum(rounds) / max(1, len(rounds)),
             sum((r.get('errors') or 0) for r in res.values() if r)))
    for k in sorted(cmd, key=lambda k: -cmd[k][0]):
        if cmd[k][0] >= 3: print('   %-28s uses %3d  nothing %3d' % (k, cmd[k][0], cmd[k][1]))
if len(runs) == 2:
    a, b = data[runs[0]][3], data[runs[1]][3]
    same = sum(1 for k in a if a[k] and b.get(k) and a[k].get('winner') == b[k].get('winner'))
    print('same winner %d of %d' % (same, len(a)))
    for k in sorted(a):
        ra, rb = a[k], b.get(k)
        if ra and rb: print('  %s  %s %2d-%-2d R%d  ->  %s %2d-%-2d R%d' % (k, ('AB'[ra['winner']] if (ra['winner'] is not None and ra['winner'] >= 0) else '='), ra['vp'][0], ra['vp'][1], ra['round'],
                                                       ('AB'[rb['winner']] if (rb['winner'] is not None and rb['winner'] >= 0) else '='), rb['vp'][0], rb['vp'][1], rb['round']))
