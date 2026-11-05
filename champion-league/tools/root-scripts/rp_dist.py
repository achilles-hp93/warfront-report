import json, glob, collections, sys
root = sys.argv[1]
rows = []
for p in glob.glob(root + '/data/editions/fantasy/units/**/*.json', recursive=True):
    if p.split('/')[-1].startswith('_'): continue
    d = json.load(open(p))
    if not isinstance(d, dict) or 'rp' not in d: continue
    tags = d.get('tags') or []
    tier = next((t for t in ['EPIC HERO','EPIC','ELITE','SPECIALIST','STANDARD'] if t in tags), 'STANDARD')
    rows.append((d.get('faction') or p.split('/')[-2], d.get('id'), tier, d['rp'], 'BUILDING' in tags or 'STRUCTURE' in tags))
def band(rp):
    return '1-10' if rp <= 10 else '11-20' if rp <= 20 else '21-30' if rp <= 30 else '31+'
c = collections.Counter((r[2], band(r[3])) for r in rows if not r[4])
for k in sorted(c): print(k, c[k])
print('epic under 31:', [r for r in rows if r[2].startswith('EPIC') and r[3] <= 30])
print('total', len(rows))
