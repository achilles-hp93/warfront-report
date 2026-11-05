import json, glob, sys
root = sys.argv[1]
DMG = {'deal_damage', 'weapon_attack', 'absolute_damage', 'true_damage'}
for f in glob.glob(root + '/data/editions/fantasy/magic/**/*.json', recursive=True):
    d = json.load(open(f))
    if not isinstance(d, dict) or 'effects' not in d:
        continue
    t = str(d.get('target', 'none'))
    if not t.startswith('enemy'):
        continue
    ops = [e.get('op') for e in d['effects'] if not e.get('if_oversoul')]
    if any(o in DMG for o in ops) and any(o not in DMG for o in ops):
        print(f.split('magic/')[1], t, ops)
