import json
f = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425.jsonl'
last = None
with open(f) as fh:
    for line in fh:
        if '"task_reminder"' not in line: continue
        try: d = json.loads(line)
        except Exception: continue
        a = d.get('attachment', {})
        if a.get('type') == 'task_reminder': last = (d.get('timestamp'), a.get('content', []))
ts, items = last
out = '/home/user/warfront-report/champion-league/task-history/'
json.dump({'exportedFromReminderAt': ts, 'count': len(items), 'tasks': items}, open(out + 'tasks-until-2026-11-05.json', 'w'), indent=1, ensure_ascii=False)
with open(out + 'tasks-until-2026-11-05.md', 'w') as md:
    md.write('# Task list of the 2026-10-21 to 2026-11-05 session\n\nOne line per task (id, status, subject); descriptions are in the JSON beside this file.\n\n')
    for t in items:
        md.write('- #%s [%s] %s\n' % (t.get('id'), t.get('status'), t.get('subject')))
st = {}
for t in items: st[t.get('status')] = st.get(t.get('status'), 0) + 1
print(ts, len(items), st)
print('open ones:', [(t['id'], t['status']) for t in items if t.get('status') != 'completed'])
