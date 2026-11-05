import json, glob, sys, os
root = sys.argv[1]
base = root + '/data/editions/fantasy'
for f in sorted(glob.glob(base + '/**/*.json', recursive=True)):
    try:
        d = json.load(open(f, encoding='utf-8-sig'))
    except Exception:
        continue
    def walk(x, path):
        if isinstance(x, dict):
            effs = x.get('effects')
            if isinstance(effs, list) and any(isinstance(e, dict) and e.get('op') == 'add_resource' for e in effs):
                res = [e.get('resource') for e in effs if isinstance(e, dict) and e.get('op') == 'add_resource']
                print(os.path.relpath(f, base), x.get('id') or x.get('name'), 'phase=', x.get('phase'), 'trigger=', x.get('trigger'), res,
                      'ops=', [e.get('op') for e in effs if isinstance(e, dict)])
            for k, v in x.items():
                if k != 'effects':
                    walk(v, path + [k])
        elif isinstance(x, list):
            for v in x:
                walk(v, path)
    walk(d, [])
