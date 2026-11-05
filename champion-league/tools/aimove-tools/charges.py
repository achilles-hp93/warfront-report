import json,sys,glob,os
from collections import Counter
root,pfx=sys.argv[1],sys.argv[2]
cat=Counter(); ex=[]
for d in sorted(glob.glob(os.path.join(root,'battle_reports',pfx+'-m*'))):
  f=os.path.join(d,'report.json')
  if not os.path.exists(f): continue
  r=json.load(open(f)); name=os.path.basename(d)
  melee=set((c['round'],c['attacker']['uid']) for c in r['combats'] if c.get('kind')=='melee' and c.get('attacker'))
  log=r['log']; pr=r.get('probe') or []
  for mv in r['moves']:
    if not mv.get('charged'): continue
    if (mv['round'],mv['uid']) in melee: cat['attacked']+=1; continue
    sq=[mv['to']['col'],mv['to']['row']]
    preds=[p for p in pr if p['kind']=='leaves' and p['name']==mv['name'] and p['round']==mv['round'] and p['sq']==sq]
    lv=[p['leaves'] if isinstance(p['leaves'],bool) else p['leaves'].get('leaves') for p in preds]
    key='pred-leaves' if any(lv) else ('pred-stays' if preds else 'no-pred')
    cat[key]+=1
    ex.append((name,mv['round'],mv['name'],key,[p['target'] for p in preds]))
print(dict(cat))
if '--detail' in sys.argv:
  for e in ex: print(e)
