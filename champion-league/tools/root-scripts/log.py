import json,sys,os
name=sys.argv[1]
r=json.load(open(os.environ['WARFRONT_OUTPUT_DIR']+'/battle_reports/'+name+'/report.json'))
rnd=int(sys.argv[2]) if len(sys.argv)>2 else None
for i,l in enumerate(r['log']):
    if rnd is None or l['round']==rnd:
        print(i,l['round'],l['phase'],l['msg'])
