import json, re, collections, statistics
D = json.load(open('main_classified.json'))
order, msg, results, tool_info = D['order'], D['msg'], D['results'], D['tool_info']
def ctx(u): return (u.get('input_tokens',0) or 0) + (u.get('cache_read_input_tokens',0) or 0) + (u.get('cache_creation_input_tokens',0) or 0)
def cost(u):  # input-token-equivalents at Opus-style ratios
    return (u.get('input_tokens',0) or 0) + 0.1*(u.get('cache_read_input_tokens',0) or 0) + 1.25*(u.get('cache_creation_input_tokens',0) or 0) + 5*(u.get('output_tokens',0) or 0)
series = [(i, msg[m]['ts'], ctx(msg[m]['usage']), cost(msg[m]['usage'])) for i, m in enumerate(order) if msg[m]['usage'].get('output_tokens') is not None and ctx(msg[m]['usage']) > 0]
cs = [s[2] for s in series]
print('calls with context', len(cs))
print('context size: median %dK  p90 %dK  max %dK' % (statistics.median(cs)/1e3, sorted(cs)[int(len(cs)*.9)]/1e3, max(cs)/1e3))
for lo, hi in ((0,100e3),(100e3,200e3),(200e3,400e3),(400e3,600e3),(600e3,800e3),(800e3,2e9)):
    sel = [s for s in series if lo <= s[2] < hi]
    print('  ctx %4d-%4dK: %5d calls (%.0f%%)  cost share %.0f%%' % (lo/1e3, min(hi,9999e3)/1e3, len(sel), 100*len(sel)/len(series), 100*sum(s[3] for s in sel)/sum(s[3] for s in series)))
# compaction boundaries: context drops by >50%
bounds = [0]
for a, b in zip(series, series[1:]):
    if b[2] < 0.5*a[2] and a[2] > 150e3: bounds.append(b[0])
print('compactions detected', len(bounds)-1)
# cost by month-day
byday = collections.Counter()
for i, ts, c, k in series: byday[ts[:10]] += k
tot = sum(byday.values())
print('--- cost-weighted share by day (input-equivalent tokens) ---')
for d in sorted(byday): print(d, '%.1fM' % (byday[d]/1e6), '%.0f%%' % (100*byday[d]/tot))
# categories
def cat(mid):
    tools = msg[mid]['tools']
    if not tools: return 'text-only/thinking (no tool)'
    names = [t[1] for t in tools]; txt = ' '.join(t[2] for t in tools)
    if any(n.startswith('Artifact') for n in names): return 'Artifact (publish/read)'
    if any(n in ('Agent',) for n in names): return 'spawn subagent'
    if any(n == 'SendMessage' for n in names): return 'message subagent'
    if any(n == 'Monitor' for n in names): return 'Monitor'
    if re.search(r'battle_report|league\.cjs|record\.cjs|batch\.cjs|digest\.cjs|effects\.cjs|build\.cjs|commentary|cl-shadow|cl-out|games/game', txt): return 'battle report / league tools'
    if re.search(r'generate_game|run_unit_tests|run_all_tests|browser_smoke|node scripts/', txt): return 'build / tests'
    if re.search(r'git |gh |merge', txt): return 'git'
    if any(n in ('Edit','Write') for n in names): return 'edit/write file'
    if any(n in ('Read','Grep','Glob') for n in names): return 'read/search'
    if any(n == 'Bash' for n in names): return 'other bash'
    return 'other'
cc = collections.Counter(); cn = collections.Counter(); co = collections.Counter(); cr = collections.Counter()
for i, m in enumerate(order):
    u = msg[m]['usage']
    if ctx(u) == 0: continue
    c = cat(m); cc[c] += cost(u); cn[c] += 1; co[c] += u.get('output_tokens',0) or 0; cr[c] += u.get('cache_read_input_tokens',0) or 0
tot = sum(cc.values())
print('--- cost-weighted share by what the call did ---')
for k, v in cc.most_common():
    print('%-32s calls %5d  cost %7.1fM (%2.0f%%)  cacheRead %7.0fM  output %6.0fK' % (k, cn[k], v/1e6, 100*v/tot, cr[k]/1e6, co[k]/1e3))
