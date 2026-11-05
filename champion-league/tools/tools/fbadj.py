import json,sys
d=json.load(open(sys.argv[1]))
snaps=d['snaps']
# positions at start of round r = snapshot labelled end of round r-1 (or deployment)
def start_pos(r):
    s = snaps[0] if r==1 else [x for x in snaps if x['round']==r-1 and x['phase']=='CLEANUP'][0]
    return {u['uid']:(u.get('col'),u.get('row')) for u in s['units'] if u.get('alive',True)}
moves=sorted(d['moves'], key=lambda m:m['seq'])
def adj(a,b):
    return a and b and a[0] is not None and b[0] is not None and max(abs(a[0]-b[0]),abs(a[1]-b[1]))<=1
uidname={u['uid']:u['name'] for u in d['units']}
# partner uid mapping
name2uid={u['name']:u['uid'] for u in d['units']}
for fb in d['fallBacks']:
    r=fb['round']; pos=start_pos(r)
    eng=[e['uid'] for e in (fb.get('board') or {}).get('engagers',[])]
    ever={e:False for e in eng}
    def check():
        for e in eng:
            if adj(pos.get(fb['uid']), pos.get(e)): ever[e]=True
    check()
    for m in moves:
        if m['round']!=r: continue
        pos[m['uid']]=(m['to']['col'],m['to']['row'])
        if m.get('partner') and m['partner'] in name2uid: pos[name2uid[m['partner']]]=(m['to']['col'],m['to']['row'])
        check()
    verdict = 'FELL BACK' if fb['fellBack'] else 'stayed'
    print(f"R{r} {fb['phase']} {fb['name']} (P{fb['player']}) {verdict}; engagers: " + ', '.join(f"{uidname.get(e)}={'adjacent' if ever[e] else 'NEVER adjacent'}" for e in eng))
