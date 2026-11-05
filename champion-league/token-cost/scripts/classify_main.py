import json, re, collections, sys
f = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425.jsonl'
order = []            # message ids in first-seen order
msg = {}              # mid -> dict(ts, usage, tools=[(id,name,summary)])
tool_info = {}        # tool_use_id -> (name, summary, mid)
results = []          # (tool_use_id, chars, order_index_at_time)
with open(f) as fh:
    for line in fh:
        try: d = json.loads(line)
        except Exception: continue
        t = d.get('type')
        if t == 'assistant':
            m = d['message']; mid = m.get('id'); u = m.get('usage')
            if not mid or not u: continue
            if mid not in msg:
                order.append(mid)
                msg[mid] = {'ts': d.get('timestamp'), 'tools': [], 'model': m.get('model')}
            msg[mid]['usage'] = u
            for b in m.get('content', []):
                if isinstance(b, dict) and b.get('type') == 'tool_use':
                    inp = b.get('input', {})
                    s = inp.get('command') or inp.get('file_path') or inp.get('prompt') or inp.get('description') or json.dumps(inp)[:200]
                    s = str(s)[:400]
                    msg[mid]['tools'].append((b['id'], b['name'], s))
                    tool_info[b['id']] = (b['name'], s, mid)
        elif t == 'user':
            c = d.get('message', {}).get('content')
            if isinstance(c, list):
                for b in c:
                    if isinstance(b, dict) and b.get('type') == 'tool_result':
                        cc = b.get('content')
                        if isinstance(cc, list):
                            n = sum(len(x.get('text', '')) for x in cc if isinstance(x, dict))
                        else:
                            n = len(cc or '')
                        results.append((b.get('tool_use_id'), n, len(order)))
json.dump({'order': order, 'msg': msg, 'results': results, 'tool_info': {k: list(v) for k, v in tool_info.items()}}, open('main_classified.json', 'w'))
print('calls', len(order), 'tool results', len(results))
