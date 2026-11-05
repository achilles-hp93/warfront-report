import json, re, collections
D = json.load(open('main_classified.json'))
order, msg, results, tool_info = D['order'], D['msg'], D['results'], D['tool_info']
def cost(u):
    return (u.get('input_tokens',0) or 0) + 0.1*(u.get('cache_read_input_tokens',0) or 0) + 1.25*(u.get('cache_creation_input_tokens',0) or 0) + 5*(u.get('output_tokens',0) or 0)
pat = [
 ('wait/poll (sleep, until, tail, wc, ls, cat log)', r'\bsleep\b|until |tail -|wc -l|ls -l|ls -la|\bcat [^|]*\.(log|txt)|\bps |pgrep|\bdf |\bdu '),
 ('inline python/node analysis scripts', r'python3? |node -e|node <<|python -'),
 ('grep/find/head/sed (read code via shell)', r'\bgrep\b|\brg\b|\bfind\b|\bhead\b|\bsed -n|\bawk\b'),
 ('git', r'\bgit\b'),
 ('cp/mkdir/ln/rm/mv (setup)', r'\bcp |mkdir|\bln -s|\brm |\bmv '),
 ('curl/other', r'curl'),
]
cc = collections.Counter(); cn = collections.Counter()
for m in order:
    t = msg[m]['tools']
    if not t or not all(x[1] == 'Bash' for x in t): continue
    txt = ' '.join(x[2] for x in t)
    if re.search(r'battle_report|league\.cjs|record\.cjs|batch\.cjs|digest\.cjs|effects\.cjs|build\.cjs|commentary|cl-shadow|cl-out|games/game|generate_game|run_unit_tests|run_all_tests|browser_smoke', txt): continue
    if re.search(r'\bgit\b|\bgh\b', txt): continue
    k = 'unclassified bash'
    for name, p in pat:
        if re.search(p, txt): k = name; break
    cc[k] += cost(msg[m]['usage']); cn[k] += 1
tot = sum(cc.values())
for k, v in cc.most_common(): print('%-52s calls %5d cost %6.1fM (%2.0f%% of bash-other)' % (k, cn[k], v/1e6, 100*v/tot))
# biggest tool results and how long they were carried
sizes = {}
for tid, n, idx in results:
    sizes[tid] = (n, idx)
# compaction boundaries
def ctx(u): return (u.get('input_tokens',0) or 0) + (u.get('cache_read_input_tokens',0) or 0) + (u.get('cache_creation_input_tokens',0) or 0)
ctxs = [ctx(msg[m]['usage']) for m in order]
bounds = []
for i in range(1, len(ctxs)):
    if ctxs[i] < 0.5*ctxs[i-1] and ctxs[i-1] > 150e3 and ctxs[i] > 0: bounds.append(i)
bounds.append(len(order))
def next_bound(i):
    for b in bounds:
        if b > i: return b
    return len(order)
rows = []
for tid, (n, idx) in sizes.items():
    if tid not in tool_info: continue
    name, summ, _ = tool_info[tid]
    toks = n/3.6
    carried = next_bound(idx) - idx
    rows.append((toks*carried, toks, carried, name, summ))
rows.sort(reverse=True)
print('\n--- top 25 tool results by carry cost (tokens x later calls until next compaction) ---')
for carry, toks, carried, name, summ in rows[:25]:
    print('%6.1fM-token-reads  size~%5.0fK tok  carried %4d calls | %s | %s' % (carry/1e6, toks/1e3, carried, name, summ[:110].replace('\n',' ')))
tot_res = sum(r[1] for r in rows); tot_carry = sum(r[0] for r in rows)
print('\nall tool results: total size ~%.1fM tokens; sum(size x calls carried) = %.0fM token-reads' % (tot_res/1e6, tot_carry/1e6))
big = [r for r in rows if r[1] > 10e3]
print('results >10K tokens: %d of %d, total %.1fM tokens, carry %.0fM (%.0f%% of all carry)' % (len(big), len(rows), sum(r[1] for r in big)/1e6, sum(r[0] for r in big)/1e6, 100*sum(r[0] for r in big)/tot_carry))
