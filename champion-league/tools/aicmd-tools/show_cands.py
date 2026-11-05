import json, sys
# usage: show_cands.py <report.json> [rounds comma list]
d = json.load(open(sys.argv[1]))
rounds = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
for w in d['probe'].get('whatifHq', []):
    if rounds and w['round'] not in rounds:
        continue
    print('R%d P%d cp=%s issued=%s' % (w['round'], w['player'], w['cp'], w['issued']), w['cands'])
    for x in w.get('dts', []):
        print('      DT', x)
print('errors', d['probe'].get('whatifErrors', [])[:2])
