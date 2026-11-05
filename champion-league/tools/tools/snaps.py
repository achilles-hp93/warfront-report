import json,sys
d=json.load(open(sys.argv[1]))
for s in d['snaps']:
    print('==', s['label'], 'r', s['round'], s['phase'], 'players', json.dumps(s.get('players'))[:300])
    print('  obj', ' '.join(f"({o['col']},{o['row']}) {o['vp']}VP owner={o['owner']}" for o in s['objectives']))
    for u in s['units']:
        if not u.get('alive') and s['label']!='deployment': 
            print(f"   P{u['player']} {u['name']}: dead"); continue
        extra=''
        if u.get('joinedSquad'): extra+=f" leads {u['joinedSquad']}"
        if u.get('joinedCharacter'): extra+=f" led by {u['joinedCharacter']}"
        print(f"   P{u['player']} {u['name']} @{u.get('col')},{u.get('row')} hp {u['hp']}/{u['maxHp']} m{u['models']} {','.join(u.get('statuses') or [])}{extra}")
