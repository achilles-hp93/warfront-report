import json, sys, os, collections, glob
d = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/subagents'
rows = []
for p in sorted(glob.glob(d + '/*.jsonl')):
    seen = {}
    first_prompt = None
    first_ts = last_ts = None
    with open(p) as fh:
        for line in fh:
            try: x = json.loads(line)
            except Exception: continue
            ts = x.get('timestamp')
            if ts:
                first_ts = first_ts or ts
                last_ts = ts
            if x.get('type') == 'user' and first_prompt is None:
                c = x.get('message', {}).get('content')
                if isinstance(c, list):
                    c = ' '.join(b.get('text', '') for b in c if isinstance(b, dict))
                first_prompt = (c or '')[:160].replace('\n', ' ')
            if x.get('type') == 'assistant':
                m = x.get('message', {})
                if m.get('id') and m.get('usage'):
                    seen[m['id']] = (m.get('model'), m['usage'])
    t = collections.Counter()
    for mid, (model, u) in seen.items():
        for k in ('input_tokens','output_tokens','cache_creation_input_tokens','cache_read_input_tokens'):
            t[k] += u.get(k, 0) or 0
    rows.append((os.path.basename(p), len(seen), t, first_ts, last_ts, first_prompt))
tot = collections.Counter()
for r in rows:
    for k, v in r[2].items(): tot[k] += v
print('subagents', len(rows), 'messages', sum(r[1] for r in rows))
print('TOTAL', dict(tot))
rows.sort(key=lambda r: -r[2]['cache_read_input_tokens'])
print('--- top 25 by cache read ---')
for r in rows[:25]:
    print(r[0][:28], 'msgs', r[1], 'cacheRead %.1fM' % (r[2]['cache_read_input_tokens']/1e6), 'cacheCreate %.2fM' % (r[2]['cache_creation_input_tokens']/1e6), 'out %.0fK' % (r[2]['output_tokens']/1e3), '|', r[5][:120])
json.dump([[r[0], r[1], dict(r[2]), r[3], r[4], r[5]] for r in rows], open('sub_rows.json', 'w'))
