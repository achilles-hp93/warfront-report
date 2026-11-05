import json, glob, sys
root = sys.argv[1]
for f in sorted(glob.glob(root + '/data/editions/fantasy/magic/runeforge_directorate/rune/*.json')):
    d = json.load(open(f))
    for k in ('desc', 'flavor', 'lore'):
        d.pop(k, None)
    print('==', f.split('/')[-1])
    print(json.dumps(d))
