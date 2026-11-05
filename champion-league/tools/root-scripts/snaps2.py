import json,sys,os
name=sys.argv[1]
r=json.load(open(os.environ['WARFRONT_OUTPUT_DIR']+'/battle_reports/'+name+'/report.json'))
for s in r['snaps']:
    print('==',s['label'],s['round'],s['phase'], 'VP',[p['vp'] for p in s['players']],'CP',[p['cp'] for p in s['players']],'pools',[p['pools'] for p in s['players']])
    print(' obj',[(o['col'],o['row'],o['vp'],o['owner']) for o in s['objectives']])
    for p in (0,1):
        print('  P%d:'%p, '; '.join('%s %d,%d %d/%d%s%s'%(u['name'],u['col'],u['row'],u['hp'],u['maxHp'],'' if u['alive'] else ' DEAD',(' '+','.join(str(x.get('id',x) if isinstance(x,dict) else x) for x in u['statuses'])) if u['statuses'] else '') for u in s['units'] if u['player']==p))
