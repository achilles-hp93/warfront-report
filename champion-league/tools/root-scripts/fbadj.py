import json,sys,os
name=sys.argv[1]
r=json.load(open(os.environ['WARFRONT_OUTPUT_DIR']+'/battle_reports/'+name+'/report.json'))
snaps={s['round']:s for s in r['snaps'] if s['label']!='deployment'}
dep=r['snaps'][0]
def startpos(uid,rnd):
    s=snaps.get(rnd-1) if rnd>1 else dep
    if s is None: return None
    for u in s['units']:
        if u['uid']==uid and u['alive']: return (u['col'],u['row'])
    return None
def positions(uid,rnd):
    ps=set()
    p=startpos(uid,rnd)
    if p: ps.add(p)
    for m in r['moves']:
        if m['round']==rnd and m['uid']==uid:
            ps.add((m['from']['col'],m['from']['row'])); ps.add((m['to']['col'],m['to']['row']))
    return ps
for f in r['fallBacks']:
    if f['fellBack']: tag='FELL BACK'
    else: tag='stayed'
    up=positions(f['uid'],f['round'])
    out=[]
    for e in f['board']['engagers']:
        ep=positions(e['uid'],f['round'])
        d=min((max(abs(a[0]-b[0]),abs(a[1]-b[1])) for a in up for b in ep),default=None)
        out.append('%s d=%s'%(e['name'],d))
    print('R%d %s %s %s | %s'%(f['round'],f['phase'],f['name'],tag,', '.join(out)))
