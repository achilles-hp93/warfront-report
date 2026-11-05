import json, re, os, sys, collections
PRE = sys.argv[1] if len(sys.argv) > 1 else 'w1'
S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad'
uses = collections.defaultdict(list)
for line in open(S + '/aicmd-day1-commands.txt'):
    m = re.match(r'M(\d+) R(\d+) COMMAND (.+?) by .+? on (.+?): (nothing|paid off|[a-z ]+?) - ', line)
    if m: uses[m.group(1)].append((int(m.group(2)), m.group(3), m.group(4), m.group(5)))
CMDS = ('Double Time', 'Secure Objective', 'Scouting Order', 'Troop Requisition')
tot = collections.Counter()
detail = []
leaves_tot = collections.Counter()
leave_rows = []
for n in sorted(uses):
    path = S + '/wt-aicmd-base/battle_reports/' + PRE + '-m%s/report.json' % n
    if not os.path.exists(path): continue
    d = json.load(open(path))
    p = d.get('probe') or {}
    if p.get('whatifErrors'): print('M%s errors' % n, p['whatifErrors'][:2])
    old = collections.defaultdict(list)
    for e in p.get('hq', []):
        if 'error' not in e: old[(e['round'], e['player'])].append(e)
    seen = collections.Counter()
    decisions = []
    for w in p.get('whatifHq', []):
        key = (w['round'], w['player']); i = seen[key]; seen[key] += 1
        o = old[key][i] if i < len(old[key]) else None
        decisions.append((w, o))
    for (r, cmd, target, verdict) in uses[n]:
        if cmd not in CMDS: continue
        hit = None
        for w, o in decisions:
            if o and o.get('chosen') and w['round'] == r and o['chosen'][0] == cmd and (cmd == 'Troop Requisition' or o['chosen'][1] == target):
                hit = (w, o); break
        if not hit:
            detail.append('M%s R%s %s on %s (%s): no matching decision' % (n, r, cmd, target, verdict)); continue
        w, o = hit
        newc = [c for c in w['cands'] if c[0] == cmd and (cmd == 'Troop Requisition' or c[1] == target)]
        kept = bool(newc)
        tot[(cmd, verdict, 'new offers it' if kept else 'new drops it')] += 1
        best = sorted(w['cands'], key=lambda c: -c[2])[:3]
        detail.append('M%s R%s %-16s on %-28s %-8s old w=%-6s new: %s | new top: %s' % (n, r, cmd, target, verdict, o['chosen'][2],
            ('w=%s' % newc[0][2]) if kept else 'NOT A CANDIDATE', best))
    for l in p.get('whatifLeaves', []):
        if not (l.get('stake') or 0) > 0: continue
        nc = l.get('newChoice'); fb = l.get('newFallBack')
        verdict = 'stays' if (nc == 'stays' or (isinstance(nc, list) and nc[3] == 'stays in area') or fb == 'stays') else 'leaves'
        leaves_tot[verdict] += 1
        leave_rows.append('M%s R%s %-26s %s obj%s OLD %-22s NEW %-34s stake %s' % (n, l['round'], l['unit'], l['at'], l['obj'], l['old'], nc if nc else ('fb ' + str(fb)), l['stake']))
for k in sorted(tot): print(tot[k], k)
print()
for x in detail: print(x)
print('\nleaves with VP at stake:', dict(leaves_tot))
for x in leave_rows: print(x)
