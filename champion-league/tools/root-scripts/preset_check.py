import json,glob,sys,collections
rules=json.load(open('data/army_rules.json'))
units={}
for f in glob.glob('data/editions/fantasy/units/**/*.json',recursive=True):
    try: d=json.load(open(f))
    except: continue
    if isinstance(d,dict) and 'id' in d and 'rp' in d: units[(d.get('faction'),d['id'])]=d
def tier(t):
    for k in ('EPIC HERO','EPIC','ELITE','SPECIALIST','STANDARD'):
        if k in t: return k
    return ''
def check(fac, d):
    rp=0; std=0; cnt=collections.Counter(); probs=[]
    for u in d['units']:
        t=units.get((fac,u))
        if not t: probs.append('unknown '+u); continue
        rp+=t['rp']; tr=tier(t.get('tags',[])); cnt[(tr,u)]+=1
        if tr=='STANDARD': std+=1
        if t.get('subfaction') and t['subfaction']!=d.get('subfactionId'): probs.append(f"{u} needs {t['subfaction']}")
    if rp>rules['max_rp']: probs.append(f'RP {rp}>{rules["max_rp"]}')
    if std<rules['min_standard']: probs.append(f'STANDARD {std}<{rules["min_standard"]}')
    if len(d['units'])>rules['max_units']: probs.append('too many units')
    lim={'SPECIALIST':rules['specialist_max'],'ELITE':rules['elite_max'],'EPIC':rules['epic_max']}
    for (tr,u),n in cnt.items():
        if tr in lim and n>lim[tr]: probs.append(f'{u} x{n} > {tr} {lim[tr]}')
    if sum(n for (tr,u),n in cnt.items() if tr=='EPIC HERO')>rules['epic_hero_max']: probs.append('EPIC HERO >1')
    return rp, std, probs
for f in sorted(glob.glob('data/editions/fantasy/preset_armies/*/*.json')):
    fac=f.split('/')[-2]
    if len(sys.argv)>1 and fac not in sys.argv[1:]: continue
    d=json.load(open(f)); rp,std,probs=check(fac,d)
    print(f"{fac[:14]:14s} {d['id']:26s} {d.get('name','')[:22]:22s} RP {rp:3d} STD {std:2d} units {len(d['units']):2d} {'; '.join(probs)}")
