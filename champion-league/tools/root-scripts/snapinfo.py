import json, sys, os
name = sys.argv[1]
base = os.environ['WARFRONT_OUTPUT_DIR'] + '/battle_reports/' + name + '/report.json'
d = json.load(open(base))
print('meta mode', d['meta'].get('mode'), 'deployment', d['meta'].get('deployment'), 'initiative', d['meta'].get('initiative'))
print('errors', d.get('errors'))
print('result', d['result'])
for s in d['snaps']:
    print('==', s['label'], 'R', s['round'], s['phase'])
    print('  players', [(p['vp'], p['cp'], p.get('pools'), p.get('primary')) for p in s['players']])
    print('  objectives', [(o['col'], o['row'], o['vp'], o['owner']) for o in s['objectives']])
    for u in s['units']:
        if not u['alive']:
            continue
        print('   P%d %-34s (%2d,%2d) hp %s/%s m%s %s %s' % (u['player'], u['name'], u['col'], u['row'], u['hp'], u['maxHp'], u['models'], ('+' + u['joinedSquad']) if u.get('joinedSquad') else '', ','.join(str(x) for x in u.get('statuses') or [])))
