#!/bin/bash
# compare.sh <prefixA> <dirA> <prefixB> <dirB> [matches...]
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
python3 - "$@" <<'PY'
import sys, subprocess, json, os, glob
pa, da, pb, db = sys.argv[1:5]
only = set(int(x) for x in sys.argv[5:])
T='/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad'
def run(p, d):
    out = subprocess.run(['python3', T + '/aimove-tools/metrics.py', d, p], capture_output=True, text=True).stdout.splitlines()
    head = out[0].split()
    rows = {}
    for line in out[1:]:
        if line.startswith('TOTAL'): continue
        parts = line.split()
        m = int(parts[0].split('-m')[1])
        if only and m not in only: continue
        # name win rnd [vpA, vpB] metrics...
        vp = line[line.index('['):line.index(']')+1]
        rest = line[line.index(']')+1:].split()
        rows[m] = (parts[1], parts[2], json.loads(vp), [int(x) for x in rest])
    keys = head[4:]
    return keys, rows
ka, ra = run(pa, da)
kb, rb = run(pb, db)
common = sorted(set(ra) & set(rb))
print('matches', common)
print('%-12s %8s %8s' % ('metric', pa, pb))
for i, k in enumerate(ka):
    sa = sum(ra[m][3][i] for m in common); sb = sum(rb[m][3][i] for m in common)
    print('%-12s %8d %8d' % (k, sa, sb))
for m in common:
    print('m%02d  %s R%s %s   ->   %s R%s %s' % (m, ra[m][0], ra[m][1], ra[m][2], rb[m][0], rb[m][1], rb[m][2]))
PY
