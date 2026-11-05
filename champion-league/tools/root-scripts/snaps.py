import json,sys,os
name=sys.argv[1]
r=json.load(open(os.environ['WARFRONT_OUTPUT_DIR']+'/battle_reports/'+name+'/report.json'))
for s in r['snaps']:
    print('==',s['label'],s['round'],s['phase'])
    print(' players',json.dumps(s['players'])[:600])
    print(' objectives',json.dumps(s['objectives'])[:800])
    for u in s['units']:
        uu={k:v for k,v in u.items() if k not in ('image',)}
        print('  ',json.dumps(uu)[:300])
    if len(sys.argv)>2: break
