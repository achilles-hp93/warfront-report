import json, glob, os, sys
root = sys.argv[1]
OFF = {'TOUGH-HUNTER', 'INFANTRY-HUNTER', 'ASSAULT', 'SHOCK', 'INDIRECT-FIRE', 'AREA-DENIAL'}
DMG = {'deal_damage', 'offer_damage', 'weapon_attack', 'place_field', 'schedule_effect'}
rows = []
files = glob.glob(root + '/data/editions/fantasy/abilities/**/*.json', recursive=True) + glob.glob(root + '/data/editions/fantasy/gear/**/*.json', recursive=True)
for f in files:
    if os.path.basename(f).startswith('_'):
        continue
    try:
        d = json.load(open(f))
    except Exception:
        continue
    recs = [d]
    for k in ('abilities', 'ability'):
        v = d.get(k) if isinstance(d, dict) else None
        if isinstance(v, list):
            recs += v
        elif isinstance(v, dict):
            recs.append(v)
    for r in recs:
        if not isinstance(r, dict):
            continue
        role = r.get('ai_role') or {}
        tgt = r.get('target')
        side = tgt.get('side') if isinstance(tgt, dict) else tgt
        if side != 'enemy':
            continue
        ops = [e.get('op') for e in r.get('effects', []) if isinstance(e, dict)]
        dmg = any(o in DMG for o in ops)
        offr = [k for k in role if k in OFF]
        rows.append((r.get('name'), f.replace(root + '/data/editions/fantasy/', ''), ops, list(role.keys()), dmg, bool(offr)))
for r in sorted(rows, key=lambda x: (x[4], str(x[2]))):
    if not r[4]:
        print(('OFF ' if r[5] else '    ') + str(r[0]) + ' | ' + r[1] + ' | ' + ','.join(map(str, r[2])) + ' | ' + ','.join(r[3]))
