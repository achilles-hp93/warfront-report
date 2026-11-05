#!/usr/bin/env python3
# metrics.py <reports dir> <prefix> [--detail]
import json, sys, os, re, glob
from collections import Counter, defaultdict
root, pfx = sys.argv[1], sys.argv[2]
detail = '--detail' in sys.argv
rows = []
tot = Counter()
for d in sorted(glob.glob(os.path.join(root, 'battle_reports', pfx + '-m*'))):
    f = os.path.join(d, 'report.json')
    if not os.path.exists(f): continue
    r = json.load(open(f))
    name = os.path.basename(d)
    res = r.get('result') or {}
    final = res.get('round')
    m = Counter()
    objvp = [0, 0]
    for a in r.get('attribution') or []:
        if a.get('source') == 'objectives': objvp[a['player']] += a.get('vp', 0)
    m['objVP'] = sum(objvp)
    # Fall Backs
    log = r.get('log') or []
    for e in log:
        msg = e['msg']
        if 'FALL BACK TEST' in msg:
            m['fbTests'] += 1
            if 'needs 6+' in msg:
                m['fbNeed6'] += 1
                if 'FAILED' in msg: m['fbNeed6Fail'] += 1
            if 'FAILED' in msg: m['fbFailed'] += 1
        if 'destroyed while attempting to FALL BACK' in msg: m['fbDeaths'] += 1
        mm = re.search(r'(FADING STEP|TRAPEZITE HARASSMENT|FEIGNED FLIGHT|BLOODTIDE PURSUIT): moved to', msg)
        if mm: m['grantedSteps'] += 1
    for fb in r.get('fallBacks') or []:
        if fb.get('fellBack') and fb.get('parts') and (fb.get('board') or {}).get('engagers'):
            m['fallBacks'] += 1
            if fb['parts'].get('stayDeathChance', 1) < 0.5: m['fbLowDanger'] += 1
            if fb['parts'].get('lostVp', 0) > 0: m['fbLostVp'] += 1
    # charges with no melee attack that round
    melee = set()
    for c in r.get('combats') or []:
        if c.get('kind') == 'melee' and c.get('attacker'):
            melee.add((c['round'], c['attacker']['uid']))
    for mv in r.get('moves') or []:
        if mv.get('charged'):
            m['charges'] += 1
            if (mv['round'], mv['uid']) not in melee: m['chargeNoAttack'] += 1
    # probe: walk-offs
    for p in r.get('probe') or []:
        if p.get('kind') == 'decide' and p.get('leavesArea'):
            pl = p['player']
            if p.get('ctlBefore') == pl and p.get('ctlAfter') != pl:
                m['walkOffHeld'] += 1
                if p['round'] == final: m['walkOffHeldFinal'] += 1
                if detail: print('  walkoff', name, 'R%d' % p['round'], p['name'], p['type'], p['from'], '->', p['dest'], 'obj', p['obj'])
            elif p.get('ctlBefore') != 1 - pl and p.get('ctlAfter') == 1 - pl:
                m['walkOffGives'] += 1
                if detail: print('  walkoff-gives', name, 'R%d' % p['round'], p['name'], p['type'], p['from'], '->', p['dest'], 'obj', p['obj'])
    # presence: non-HQ units in an Objective Area at each round's end; idle: alive
    # non-HQ units on the board that round with no attack or ability
    acts = set((a['round'], a['uid']) for a in (r.get('activity') or []) if a.get('kind') in ('ranged', 'melee', 'ability', 'rite', 'magic'))
    for sn in r.get('snaps') or []:
        if not (str(sn.get('label', '')).startswith('end of round') or sn.get('label') == 'final'): continue
        objs = sn.get('objectives') or []
        for u in sn.get('units') or []:
            if u.get('isHQ') or not u.get('alive') or u.get('col') is None or u['col'] < 0: continue
            if any(max(abs(u['col'] - o['col']), abs(u['row'] - o['row'])) <= 1 for o in objs): m['onObjRounds'] += 1
            if (sn['round'], u['uid']) not in acts: m['idleRounds'] += 1
            m['unitRounds'] += 1
    rows.append((name, res.get('winner'), res.get('round'), res.get('vp'), dict(m)))
    tot.update(m)
keys = ['objVP', 'onObjRounds', 'idleRounds', 'unitRounds', 'fallBacks', 'fbLowDanger', 'fbLostVp', 'fbTests', 'fbNeed6', 'fbNeed6Fail', 'fbFailed', 'fbDeaths', 'charges', 'chargeNoAttack', 'walkOffHeld', 'walkOffHeldFinal', 'walkOffGives', 'grantedSteps']
print('battle            win rnd vp      ' + ' '.join(k[:9].rjust(9) for k in keys))
for name, w, rd, vp, m in rows:
    print(name.ljust(17), str(w).rjust(3), str(rd).rjust(3), str(vp).ljust(9), ' '.join(str(m.get(k, 0)).rjust(9) for k in keys))
print('TOTAL ' + str(len(rows)).ljust(30) + ' '.join(str(tot.get(k, 0)).rjust(9) for k in keys))
