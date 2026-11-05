import json,glob,os,sys
root='/home/user/warfront/data/editions/fantasy/units'
idx={}
for f in glob.glob(root+'/**/*.json',recursive=True):
    try: d=json.load(open(f))
    except Exception: continue
    if isinstance(d,dict) and 'id' in d: idx[d['id']]=(f,d)
for uid in sys.argv[1:]:
    if uid not in idx: print('MISSING',uid); continue
    f,d=idx[uid]
    print('=====',uid,'|',d.get('name'),'|',d.get('rp'),'|',','.join(d.get('tags',[])))
    print('ROLE:',d.get('role'))
    print('REAL:',d.get('real_life'))
    print('LORE:',(d.get('lore') or '')[:1400])
    print('ABIL:',[a.get('ability_id') for a in d.get('abilities',[])], 'WPN:',d.get('weapon_id'))
