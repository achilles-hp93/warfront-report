"""Mark presets2.json: new presets, and units added/removed in the fixed ones (vs git HEAD)."""
import collections, json, os, subprocess
S = os.path.dirname(os.path.abspath(__file__))
REPO = '/home/user/warfront'
NEW = {'palatine_guard', 'artificer_forge', 'true_cross_host', 'dragonslayer_lances', 'brazen_tower_battery', 'weeping_veil_host'}
FIXED = {'dawn_king_army': 'infernal_congregations', 'plague_monarch_army': 'infernal_congregations'}
p = json.load(open(os.path.join(S, 'presets2.json')))
for x in p:
    x['added'], x['removed'] = {}, {}
    x['isNew'] = x['id'] in NEW
    if x['id'] in FIXED:
        old = json.loads(subprocess.check_output(['git', '-C', REPO, 'show', 'b683bada:data/editions/fantasy/preset_armies/%s/%s.json' % (FIXED[x['id']], x['id'])]))
        a, b = collections.Counter(old['units']), collections.Counter(u['id'] for u in x['units'])
        x['added'] = dict(b - a); x['removed'] = dict(a - b)
        print(x['id'], 'added', x['added'], 'removed', x['removed'])
json.dump(p, open(os.path.join(S, 'presets2.json'), 'w'), indent=1)
print('presets', len(p), 'new', sum(x['isNew'] for x in p))
