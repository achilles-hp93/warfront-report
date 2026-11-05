import json,sys
r=json.load(open(sys.argv[1]))
for s in r['snaps']:
    print('==', s['label'], 'R', s['round'], s['phase'])
    print('  players', [(p['vp'],p['cp'],p.get('pools')) for p in s['players']])
    for p in (0,1):
        us=[u for u in s['units'] if u['player']==p]
        print('  P%d:'%p, '; '.join('%s@%d,%d %s/%s%s%s'%(u['name'],u['col'],u['row'],u['hp'],u['maxHp'], '' if u['alive'] else ' DEAD', (' st='+','.join(map(str,u['statuses']))) if u['statuses'] else '') for u in us))
