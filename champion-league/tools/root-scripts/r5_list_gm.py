import json, glob, sys
for f in sorted(glob.glob('data/editions/fantasy/abilities/grant_move/*.json')):
    d = json.load(open(f))
    print(f.split('/')[-1], '|', d.get('desc', '')[:200])
    print('   ', [(e.get('op'), e.get('mode'), e.get('as_charge'), e.get('offer')) for e in d.get('effects', [])])
