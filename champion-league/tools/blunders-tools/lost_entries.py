"""Count entries into Objective Areas the enemy still held by 5+ OC at the round's end.

An entry: a unit (a move record's unit, its joined partner riding along) ends its moves of a
round inside an objective's area (Chebyshev <= 1) that it did not start the round in. Held by
5+: the round's objective scoring note names the enemy as controller with an OC margin of 5 or
more. Died there: the unit (or its partner) is destroyed later in that same round.

usage: python3 lost_entries.py <report.json> [<report.json> ...]
"""
import json
import re
import sys


def cheb(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def count(path):
    r = json.load(open(path))
    objs = [(o['col'], o['row']) for o in r['meta'].get('objectives') or []] if r.get('meta') and r['meta'].get('objectives') else None
    if not objs:
        objs = [(7, 7), (1, 7), (13, 7)]
        if r.get('snaps'):
            objs = [(o['col'], o['row']) for o in r['snaps'][0]['objectives']]
    ctrl = {}
    for x in r['resources']:
        if x['kind'] == 'vp' and x.get('source') == 'objectives':
            m = re.search(r'Objective \((\d+),(\d+)\): Player (\w) \+\d+ VP \(OC (\d+) vs (\d+)\)', x['note'])
            if m:
                key = (x['round'], (int(m.group(1)), int(m.group(2))))
                ctrl.setdefault(key, ('AB'.index(m.group(3)), int(m.group(4)), int(m.group(5))))
    killed = {}
    for c in r['combats']:
        for l in c.get('losses') or []:
            if l.get('killed'):
                killed.setdefault(l['uid'], (c['round'], c.get('seq', 0)))
    by = {}
    for m in r['moves']:
        by.setdefault((m['round'], m['uid']), []).append(m)
    out = []
    for (rd, uid), ms in sorted(by.items()):
        ms.sort(key=lambda m: m['seq'])
        start = (ms[0]['from']['col'], ms[0]['from']['row'])
        end = (ms[-1]['to']['col'], ms[-1]['to']['row'])
        partner = next((m['partner'] for m in ms if m.get('partner')), None)
        for o in objs:
            if cheb(start, o) <= 1 or cheb(end, o) > 1:
                continue
            c = ctrl.get((rd, o))
            side = ms[0]['player']
            if not c or c[0] == side or c[1] - c[2] < 5:
                continue
            last_seq = ms[-1]['seq']
            died = any(k and k[0] == rd and k[1] > last_seq for k in (killed.get(uid), killed.get(partner)))
            how = ','.join(sorted({('chg' if m['charged'] else 'adv' if m['advanced'] else 'move') for m in ms}))
            out.append((rd, ms[0]['name'] + ' [' + how + ']', side, o, c, died))
    return out


total = died = 0
for path in sys.argv[1:]:
    rows = count(path)
    name = path.split('/')[-2]
    for rd, nm, side, o, c, d in rows:
        print(f"{name} R{rd} {'AB'[side]}:{nm} -> {o} held {'AB'[c[0]]} {c[1]} vs {c[2]}{' DIED' if d else ''}")
    total += len(rows)
    died += sum(1 for x in rows if x[5])
print(f"TOTAL entries {total}, died there {died}, battles {len(sys.argv) - 1}")
