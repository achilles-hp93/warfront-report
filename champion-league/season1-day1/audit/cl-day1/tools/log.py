import json,sys,re
r=json.load(open(sys.argv[1]))
rnd=int(sys.argv[2]) if len(sys.argv)>2 and sys.argv[2]!='-' else None
pat=re.compile(sys.argv[3]) if len(sys.argv)>3 else None
ph=sys.argv[4] if len(sys.argv)>4 else None
for l in r['log']:
    if rnd is not None and l.get('round')!=rnd: continue
    if ph and l.get('phase')!=ph: continue
    if pat and not pat.search(l['msg']): continue
    print(l.get('round'), l.get('phase'), l['msg'])
