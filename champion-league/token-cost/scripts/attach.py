import json, collections
f = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425.jsonl'
cnt = collections.Counter(); chars = collections.Counter()
ex = {}
usr_chars = collections.Counter(); usr_cnt = collections.Counter()
with open(f) as fh:
    for line in fh:
        try: d = json.loads(line)
        except Exception: continue
        t = d.get('type')
        if t == 'attachment':
            a = d.get('attachment', {})
            k = a.get('type', '?')
            s = json.dumps(a)
            cnt[k] += 1; chars[k] += len(s)
            if k not in ex or len(s) > len(ex[k]): ex[k] = s
        elif t == 'user':
            c = d.get('message', {}).get('content')
            if isinstance(c, str):
                k = 'user-text'; usr_chars[k] += len(c); usr_cnt[k] += 1
            elif isinstance(c, list):
                for b in c:
                    if not isinstance(b, dict): continue
                    k = 'user-' + b.get('type', '?')
                    if b.get('type') == 'text':
                        txt = b.get('text', '')
                        if txt.startswith('<task-notification') or '<task-notification>' in txt[:300]: k = 'user-text:task-notification'
                        elif '<system-reminder>' in txt[:100]: k = 'user-text:system-reminder'
                        usr_chars[k] += len(txt)
                    elif b.get('type') == 'tool_result':
                        cc = b.get('content'); n = sum(len(x.get('text','')) for x in cc if isinstance(x, dict)) if isinstance(cc, list) else len(cc or '')
                        usr_chars[k] += n
                    usr_cnt[k] += 1
print('--- attachment types: count, total chars (~tokens = chars/3.6) ---')
for k, n in cnt.most_common(): print('%-34s %6d  %7.2fM chars  ~%5.2fM tokens' % (k, n, chars[k]/1e6, chars[k]/3.6/1e6))
print('--- user content blocks ---')
for k, n in usr_cnt.most_common(): print('%-34s %6d  %7.2fM chars  ~%5.2fM tokens' % (k, n, usr_chars[k]/1e6, usr_chars[k]/3.6/1e6))
