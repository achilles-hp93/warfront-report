"""ptool.py show <faction>/<preset> ... | units <faction> [substr]"""
import json, os, sys, glob
R = '/home/user/warfront/data/editions/fantasy'
def units(fac):
    out = {}
    for f in glob.glob(f'{R}/units/{fac}/**/*.json', recursive=True):
        if os.path.basename(f).startswith('_'): continue
        d = json.load(open(f))
        if isinstance(d, dict) and 'id' in d: out[d['id']] = d
    return out
TIERS = ['EPIC HERO', 'EPIC', 'ELITE', 'SPECIALIST']
def tier(u):
    t = u.get('tags') or []
    for x in TIERS:
        if x in t: return x
    return 'STD'
def flags(u):
    t = u.get('tags') or []
    return ','.join(x for x in t if x in ('CHARACTER', 'TRANSPORT', 'HOVER', 'MOUNTED', 'VEHICLE', 'MONSTER', 'INFANTRY'))
cmd = sys.argv[1]
if cmd == 'show':
    for arg in sys.argv[2:]:
        fac, pid = arg.split('/')
        p = json.load(open(f'{R}/preset_armies/{fac}/{pid}.json'))
        U = units(fac)
        lead = {int(k): v for k, v in (p.get('leaderMap') or {}).items()}
        tr = {int(k): v for k, v in (p.get('transport') or {}).items()}
        total = 0
        print(f"== {arg}: {p['name']}  sub={p.get('subfactionId')} marshal={p.get('marshalIndex')}")
        for i, uid in enumerate(p['units']):
            u = U.get(uid, {})
            rp = u.get('rp', '?'); total += rp if isinstance(rp, int) else 0
            extra = (f' -> leads {lead[i]}' if i in lead else '') + (f' in transport {tr[i]}' if i in tr else '')
            print(f"  {i:2} {uid:32} {u.get('name','??'):34} {rp:>4} {tier(u):10} {flags(u)}{extra}")
        if p.get('gear'): print('  gear', p['gear'])
        print(f'  units RP {total}, {len(p["units"])} units')
elif cmd == 'units':
    fac = sys.argv[2]; q = (sys.argv[3] if len(sys.argv) > 3 else '').lower()
    for uid, u in sorted(units(fac).items(), key=lambda kv: kv[1].get('rp', 0)):
        if q and q not in uid.lower() and q not in u.get('name', '').lower(): continue
        print(f"  {uid:34} {u.get('name',''):38} {u.get('rp'):>4} {tier(u):10} {flags(u)}")
