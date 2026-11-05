import json, sys
d = json.load(open(sys.argv[1]))
p = d.get('probe') or {}
only = sys.argv[2] if len(sys.argv) > 2 else None
for e in p.get('hq', []):
    if 'error' in e:
        print('ERR', e); continue
    if only and only not in json.dumps(e):
        continue
    print('R%s P%s cp=%s chosen=%s pass=%s gt=%s' % (e['round'], e['player'], e['cp'], e['chosen'], e['pass'], e.get('globalTarget')))
    for c in sorted(e['cands'], key=lambda c: -c[2])[:8]:
        print('    cand', c)
    for pr in e['prices'][:6]:
        print('    price', json.dumps(pr))
print('--- move decisions')
for m in p.get('moveDecisions', []):
    if only and only not in json.dumps(m):
        continue
    print(json.dumps(m))
