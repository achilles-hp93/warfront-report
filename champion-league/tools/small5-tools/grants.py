import json, os, sys
root = sys.argv[1]
for dp, dn, fn in os.walk(root):
    for f in sorted(fn):
        if not f.endswith('.json'): continue
        p = os.path.join(dp, f)
        try: d = json.load(open(p))
        except Exception: continue
        def walk(o, trig=None):
            if isinstance(o, dict):
                t = o.get('on') or o.get('trigger') or trig
                if o.get('op') == 'grant_move':
                    keys = {k: v for k, v in o.items() if k != 'op'}
                    print(os.path.relpath(p, root), '|', t, '|', json.dumps(keys)[:240])
                for v in o.values(): walk(v, t)
            elif isinstance(o, list):
                for v in o: walk(v, trig)
        walk(d)
