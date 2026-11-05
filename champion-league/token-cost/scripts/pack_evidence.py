#!/usr/bin/env python3
"""Pack the Champion League Day 1 evidence from the session scratchpad into warfront-report.

Layout written under <repo>/champion-league/ (agg.py resolves runs relative to its own folder,
so season1-day1/cmp/agg.py runs unchanged on season1-day1/<run>/):

  season1-day1/<run>/tournaments/cl-s1/{state.json,day-1.txt}
  season1-day1/<run>/battle_reports/<battle>/{report.json.xz,effects.json,fallbacks.json,commentary.json}
  season1-day1/cl-out/archive_day1_v1/<battle>/...            the first play of Day 1
  season1-day1/cmp/                                            digests, effects text, agg.py
  season1-day1/audit/                                          audit, analysis and agent reports
  tools/<area>/                                                probe and measurement scripts
  briefs/                                                      the agent briefs
"""
import os, shutil, subprocess, sys, glob

S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad'
OUT = '/home/user/warfront-report/champion-league'
D1 = OUT + '/season1-day1'
TEXT_EXT = ('.cjs', '.js', '.py', '.sh', '.json', '.md', '.txt', '.html', '.bat')
MAX_TEXT = 400 * 1024


def cp(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)


def xz(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, 'wb') as fh:
        subprocess.run(['xz', '-9', '-T2', '-c', src], stdout=fh, check=True)


def battle_dir(src_dir, dst_dir, names):
    for b in sorted(os.listdir(src_dir)):
        sb = os.path.join(src_dir, b)
        if not (b.startswith('cl-s1-') and os.path.isdir(sb)):
            continue
        for n in names:
            f = os.path.join(sb, n)
            if not os.path.exists(f):
                continue
            if n == 'report.json':
                xz(f, os.path.join(dst_dir, b, 'report.json.xz'))
            else:
                cp(f, os.path.join(dst_dir, b, n))


def tree(src, dst, skip_dirs=(), skip_names=(), exts=TEXT_EXT, cap=MAX_TEXT):
    n = 0
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]
        for f in files:
            if f in skip_names or not f.lower().endswith(exts):
                continue
            p = os.path.join(root, f)
            if os.path.getsize(p) > cap:
                continue
            cp(p, os.path.join(dst, os.path.relpath(p, src)))
            n += 1
    return n


def main():
    # 1. the runs
    runs = {'cl-out': 'battle_reports', 'cl-shadow': 'battle_reports', 'cl-shadow2': 'battle_reports',
            'cl-shadow3': 'battle_reports', 'cl-shadow4': 'battle_reports'}
    for run, sub in runs.items():
        t = f'{S}/{run}/tournaments/cl-s1'
        for n in ('state.json', 'day-1.txt'):
            if os.path.exists(f'{t}/{n}'):
                cp(f'{t}/{n}', f'{D1}/{run}/tournaments/cl-s1/{n}')
        names = ('report.json', 'effects.json', 'fallbacks.json', 'commentary.json')
        battle_dir(f'{S}/{run}/{sub}', f'{D1}/{run}/{sub}', names)
        print('packed', run, flush=True)
    battle_dir(f'{S}/cl-out/archive_day1_v1', f'{D1}/cl-out/archive_day1_v1',
               ('report.json', 'effects.json', 'fallbacks.json', 'commentary.json'))
    print('packed archive_day1_v1', flush=True)

    # 2. comparison material
    tree(f'{S}/cmp', f'{D1}/cmp')
    # 3. the audit and analysis material of Day 1
    tree(f'{S}/cl-day1', f'{D1}/audit/cl-day1', skip_dirs=('reports',))
    tree(f'{S}/cl-day1r', f'{D1}/audit/cl-day1r', skip_dirs=('reports',))
    # 4. tools by area (skip copies of the repo's scripts, patches, logs, images)
    areas = ['tools', 'wt-report-tools', 'small5-tools', 'aiact-tools', 'aibugs-tools', 'aicmd-tools', 'aimove-tools',
             'blunders-tools', 'react-tools', 'rules4-tools', 'rules5-tools', 'idle-tools', 'rulesrec']
    for a in areas:
        n = tree(f'{S}/{a}', f'{OUT}/tools/{a}', skip_dirs=('rs', 'node_modules', '__pycache__'),
                 exts=('.cjs', '.js', '.py', '.sh', '.md', '.txt', '.json'), cap=200 * 1024)
        print('tools', a, n, flush=True)
    # one-off scripts at the scratchpad root
    for f in sorted(glob.glob(f'{S}/*')):
        if os.path.isfile(f) and f.endswith(('.cjs', '.js', '.py', '.sh')) and os.path.getsize(f) < 200 * 1024:
            cp(f, f'{OUT}/tools/root-scripts/{os.path.basename(f)}')
    # 5. briefs and written reports
    for f in ('ai_brief.md', 'cl_audit_brief.md', 'cl_commentary_brief.md', 'cl_fix_brief_common.md',
              'cl_fix_brief_round3.md', 'cl_fix_brief_round4.md', 'impl_preamble.md', 'formation_ai_scope.md'):
        if os.path.exists(f'{S}/{f}'):
            cp(f'{S}/{f}', f'{OUT}/briefs/{f}')
    if os.path.exists(f'{S}/idle_rca_report.txt'):
        cp(f'{S}/idle_rca_report.txt', f'{D1}/audit/idle_rca_report.txt')
    # 6. the token-cost analysis scripts (not their bulky outputs)
    for f in glob.glob(f'{S}/tokens/*.py'):
        cp(f, f'{OUT}/token-cost/scripts/{os.path.basename(f)}')
    print('done', flush=True)


if __name__ == '__main__':
    main()
