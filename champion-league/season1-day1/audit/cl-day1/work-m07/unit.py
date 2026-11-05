import json,sys,glob,os
base='/home/user/warfront/data/editions/fantasy'
def ab(aid):
    fs=glob.glob(base+'/abilities/**/'+aid+'.json',recursive=True)
    if not fs: return None
    return json.load(open(fs[0]))
def wp(wid):
    fs=glob.glob(base+'/weapons/**/'+wid+'.json',recursive=True)
    if not fs: return None
    return json.load(open(fs[0]))
for path in sys.argv[1:]:
    u=json.load(open(path))
    print('#####',u.get('name'),u.get('rp') or u.get('cost'),'tags',u.get('tags'))
    print(' stats', {k:u.get(k) for k in ('move','mv','ini','bs','per','save','hp','oc','models','stats') if u.get(k) is not None})
    for k in ('weapons','loadout','equipment'):
        if u.get(k): print(' ',k, json.dumps(u[k])[:600])
    for a in u.get('abilities',[]):
        aid=a if isinstance(a,str) else a.get('ability_id') or a.get('id')
        d=ab(aid) if aid else None
        print('  ability',aid, '|', (d or {}).get('name'), '|', ((d or {}).get('desc') or json.dumps(a))[:500].replace('\n',' '))
