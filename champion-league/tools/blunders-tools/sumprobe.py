"""Summarise a probe.json: destination picks, ability scores (distinct), and each round's top candidates.
usage: python3 sumprobe.py <probe.json> [unit-substring]
"""
import json
import sys
p = json.load(open(sys.argv[1]))
want = sys.argv[2] if len(sys.argv) > 2 else ''
print('errors', p.get('errors', [])[:5])
for d in p.get('dest', []):
    if want not in d['unit']:
        continue
    print(f"DEST R{d['round']} {d['phase']} {d['unit']} at {d['at']} pick {d['pick']} stay {d.get('stay')}")
    print(f"   pickBd {d.get('pickBd')}")
    if d.get('towardBd'):
        print(f"   towardBd {d.get('towardBd')}")
    for t in d.get('top', [])[:4]:
        print(f"   top {t}")
seen = set()
for a in p.get('abil', []):
    key = (a['round'], a['unit'], a['tgt'], a['score'])
    if key in seen or want not in a['unit']:
        continue
    seen.add(key)
    extra = {k: a[k] for k in ('active', 'preferredCycle', 'preferredAll', 'open', 'gunCredit', 'dist') if k in a}
    print(f"ABIL R{a['round']} {a['unit']} {a['ab']} -> {a['tgt']}: {a['score']} {extra}")
for c in p.get('cands', []):
    if want not in c['unit']:
        continue
    tops = ', '.join(f"{x['type'][:12]}{'/' + x['ab'] if x['ab'] else ''}->{x['tgt']} {x['score']}" for x in c['top'][:5])
    print(f"CAND R{c['round']} {c['phase'][:4]} {c['unit']} ap{c['ap']}: {tops}")
