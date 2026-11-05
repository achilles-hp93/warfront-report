import json, statistics, collections
f = '/root/.claude/projects/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425.jsonl'
calls = []          # per unique assistant id: ctx, out
idx = {}
rem_at = collections.defaultdict(int)   # call index -> rendered chars of reminders arriving just before this call
rem_all = []
with open(f) as fh:
    for line in fh:
        try: d = json.loads(line)
        except Exception: continue
        t = d.get('type')
        if t == 'assistant':
            m = d['message']; mid = m.get('id'); u = m.get('usage')
            if not mid or not u: continue
            if mid not in idx:
                idx[mid] = len(calls); calls.append([0, 0])
            c = (u.get('input_tokens',0) or 0) + (u.get('cache_read_input_tokens',0) or 0) + (u.get('cache_creation_input_tokens',0) or 0)
            calls[idx[mid]] = [c, u.get('output_tokens', 0) or 0]
        elif t == 'attachment':
            a = d.get('attachment', {})
            if a.get('type') == 'task_reminder':
                items = a.get('content', [])
                rendered = sum(len('#%s. [%s] %s\n' % (x.get('id'), x.get('status'), x.get('subject'))) for x in items) + 400
                rem_at[len(calls)] += rendered       # applies to the NEXT call
                rem_all.append(rendered)
print('reminders', len(rem_all), 'rendered chars: first %d, median %d, last %d, mean %d' % (rem_all[0], statistics.median(rem_all), rem_all[-1], statistics.mean(rem_all)))
tok = [r/3.6 for r in rem_all]
print('rendered tokens per reminder: median %.1fK, last %.1fK; total injected %.1fM tokens' % (statistics.median(tok)/1e3, tok[-1]/1e3, sum(tok)/1e6))
# context growth between consecutive calls, split by whether a reminder arrived in between
with_r, without_r = [], []
for i in range(1, len(calls)):
    c0, o0 = calls[i-1]; c1, _ = calls[i]
    if c0 == 0 or c1 == 0: continue
    delta = c1 - c0
    if delta < -1000: continue   # compaction or cache reset
    (with_r if rem_at.get(i) else without_r).append(delta)
print('calls where a reminder arrived: %d; median context growth %.1fK (mean %.1fK)' % (len(with_r), statistics.median(with_r)/1e3, statistics.mean(with_r)/1e3))
print('calls with no reminder:        %d; median context growth %.1fK (mean %.1fK)' % (len(without_r), statistics.median(without_r)/1e3, statistics.mean(without_r)/1e3))
print('=> a reminder adds about %.1fK tokens beyond a normal call (mean difference)' % ((statistics.mean(with_r) - statistics.mean(without_r))/1e3))
# how often do reminders fire and does the same text persist? average gap in calls
gaps = []
prev = None
for k in sorted(rem_at):
    if prev is not None: gaps.append(k - prev)
    prev = k
print('reminder fires every %.1f calls on average (median %d)' % (statistics.mean(gaps), statistics.median(gaps)))
