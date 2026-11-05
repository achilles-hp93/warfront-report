import json, sys
d = json.load(open(sys.argv[1]))
p = d.get('probe') or {}
print('errors:', len(p.get('whatifErrors', [])), (p.get('whatifErrors') or [])[:3])
old = {}
for e in p.get('hq', []):
    if 'error' in e: continue
    old.setdefault((e['round'], e['player']), []).append(e)
seen = {}
for w in p.get('whatifHq', []):
    key = (w['round'], w['player'])
    i = seen.get(key, 0); seen[key] = i + 1
    o = old.get(key, [])
    oc = o[i] if i < len(o) else None
    chosen = oc['chosen'] if oc else None
    passed = oc['pass'] if oc else None
    newc = sorted(w['cands'], key=lambda c: -c[2])
    print('R%s P%s cp=%s issued=%s | OLD chose %s %s' % (w['round'], w['player'], w['cp'], w['issued'], chosen and chosen[:4], passed or ''))
    print('      NEW candidates: %s' % (newc[:6] if newc else 'none -> passes'))
print('--- leaves (old decision moved a unit off an objective area)')
for l in p.get('whatifLeaves', []):
    print('R%s %s %s obj%s OLD %s | NEW %s fb %s | stake %s rate %s points %s' % (l['round'], l['unit'], l['at'], l['obj'], l['old'], l.get('newChoice'), l.get('newFallBack'), l['stake'], l['rate'], l['points']))
