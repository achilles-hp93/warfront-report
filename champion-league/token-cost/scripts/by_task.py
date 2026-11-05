import json, re, collections, glob, os, bisect
f = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425.jsonl'
subj = {}
events = []   # (ts, taskId, status)
calls = []    # (ts, cost, cacheRead, out)
seen = {}
last_rem = None
with open(f) as fh:
    for line in fh:
        try: d = json.loads(line)
        except Exception: continue
        t = d.get('type'); ts = d.get('timestamp')
        if t == 'attachment':
            a = d.get('attachment', {})
            if a.get('type') == 'task_reminder':
                for x in a.get('content', []): subj[str(x.get('id'))] = x.get('subject')
        elif t == 'assistant':
            m = d['message']; mid = m.get('id'); u = m.get('usage')
            if not mid or not u: continue
            seen[mid] = (ts, u)
            for b in m.get('content', []):
                if isinstance(b, dict) and b.get('type') == 'tool_use' and b.get('name') == 'TaskUpdate':
                    i = b.get('input', {})
                    if i.get('status'): events.append((ts, str(i.get('taskId')), i['status']))
def cost(u): return (u.get('input_tokens',0) or 0) + 0.1*(u.get('cache_read_input_tokens',0) or 0) + 1.25*(u.get('cache_creation_input_tokens',0) or 0) + 5*(u.get('output_tokens',0) or 0)
calls = sorted((ts, cost(u), u.get('cache_read_input_tokens',0) or 0, u.get('output_tokens',0) or 0) for ts, u in seen.values() if ts)
events.sort()
# build timeline of active task (most recently started, still in_progress)
active = []   # stack
def current_at(ts, state={'i': 0, 'act': []}):
    return None
tl = []  # (ts, active_task or None)
act = []
for ts, tid, st in events:
    if st == 'in_progress':
        if tid in act: act.remove(tid)
        act.append(tid)
    elif st in ('completed', 'deleted'):
        if tid in act: act.remove(tid)
    tl.append((ts, act[-1] if act else None))
tts = [x[0] for x in tl]
def task_for(ts):
    i = bisect.bisect_right(tts, ts) - 1
    return tl[i][1] if i >= 0 else None
main_by = collections.Counter(); calls_by = collections.Counter(); cr_by = collections.Counter()
for ts, c, cr, o in calls:
    k = task_for(ts); main_by[k] += c; calls_by[k] += 1; cr_by[k] += cr
# subagents -> task active at their first message
sub_by = collections.Counter(); sub_n = collections.Counter(); sub_cr = collections.Counter()
for p in glob.glob('/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/subagents/*.jsonl'):
    ss = {}; first = None
    with open(p) as fh:
        for line in fh:
            try: x = json.loads(line)
            except Exception: continue
            if first is None and x.get('timestamp'): first = x['timestamp']
            if x.get('type') == 'assistant':
                m = x.get('message', {})
                if m.get('id') and m.get('usage'): ss[m['id']] = m['usage']
    k = task_for(first) if first else None
    sub_by[k] += sum(cost(u) for u in ss.values()); sub_n[k] += 1; sub_cr[k] += sum((u.get('cache_read_input_tokens',0) or 0) for u in ss.values())
allk = set(main_by) | set(sub_by)
tot = sum(main_by.values()) + sum(sub_by.values())
rows = sorted(((main_by[k] + sub_by[k], k) for k in allk), reverse=True)
print('total cost (input-equivalent tokens): main %.0fM + subagents %.0fM = %.0fM' % (sum(main_by.values())/1e6, sum(sub_by.values())/1e6, tot/1e6))
print('%-5s %8s %8s %6s  %s' % ('task', 'main M', 'agents M', 'share', 'subject'))
for c, k in rows[:30]:
    print('%-5s %8.1f %8.1f %5.1f%%  %s (agents:%d)' % (k, main_by[k]/1e6, sub_by[k]/1e6, 100*c/tot, (subj.get(k) or '(none active)')[:90], sub_n[k]))
json.dump({'rows': [[k, main_by[k], sub_by[k], subj.get(k)] for c, k in rows]}, open('by_task.json', 'w'))
