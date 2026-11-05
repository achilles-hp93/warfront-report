import json, glob, sys
root = sys.argv[1]
for f in sorted(glob.glob(root + '/data/editions/fantasy/abilities/mod_unit_resource/*.json')):
    d = json.load(open(f))
    print(f.rsplit('/', 1)[1], d.get('phase'), d.get('trigger'), d.get('ai_role'),
          [(e.get('op'), e.get('resource'), e.get('amount'), e.get('target'), e.get('on')) for e in d.get('effects', [])])
d = json.load(open(root + '/data/editions/fantasy/factions/infernal_congregations/cult_of_gilded_avarice/subfaction.json'))
si = d.get('subfaction_identity') or d.get('subfactionIdentity') or {}
for r in si.get('unit_resources', []):
    print('resource', r.get('id'), r.get('on_attack'), r.get('ai_hold_value'), r.get('round_start'))
