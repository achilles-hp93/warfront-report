import json, sys, collections
f = sys.argv[1]
seen = {}
n_lines = 0
types = collections.Counter()
with open(f) as fh:
    for line in fh:
        n_lines += 1
        try:
            d = json.loads(line)
        except Exception:
            continue
        types[d.get('type')] += 1
        if d.get('type') != 'assistant':
            continue
        m = d.get('message', {})
        mid = m.get('id')
        u = m.get('usage')
        if not u or not mid:
            continue
        # keep the last record per message id (final usage after streaming)
        seen[mid] = (d.get('timestamp'), m.get('model'), u, d.get('isSidechain'))
print('lines', n_lines, dict(types))
print('assistant messages (unique ids)', len(seen))
tot = collections.Counter()
by_model = collections.defaultdict(collections.Counter)
for mid, (ts, model, u, side) in seen.items():
    for k in ('input_tokens','output_tokens','cache_creation_input_tokens','cache_read_input_tokens'):
        tot[k] += u.get(k, 0) or 0
        by_model[model][k] += u.get(k, 0) or 0
    by_model[model]['n'] += 1
print('TOTAL', dict(tot))
for m, c in by_model.items():
    print(m, dict(c))
json.dump({k: [v[0], v[1], v[2], v[3]] for k, v in seen.items()}, open(sys.argv[2], 'w'))
