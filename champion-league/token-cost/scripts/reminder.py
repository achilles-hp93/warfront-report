import json, collections
f = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425.jsonl'
rows = []
sample = None
with open(f) as fh:
    for i, line in enumerate(fh):
        if '"task_reminder"' not in line: continue
        try: d = json.loads(line)
        except Exception: continue
        a = d.get('attachment', {})
        if a.get('type') != 'task_reminder': continue
        rows.append((i, d.get('timestamp'), len(json.dumps(a)), a))
print('task_reminder count', len(rows))
a = rows[-1][3]
print('keys', list(a.keys()))
for k, v in a.items():
    s = json.dumps(v)
    print(k, type(v).__name__, len(s), s[:300].replace('\n', ' '))
