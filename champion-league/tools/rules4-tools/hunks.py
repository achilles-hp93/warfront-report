#!/usr/bin/env python3
"""List or stage single hunks of a worktree file's diff.

  hunks.py list <repo> <file>             print each hunk's index and first changed line
  hunks.py stage <repo> <file> <i,j,...>  stage only those hunks (git apply --cached)
"""
import subprocess
import sys


def diff(repo, path):
    return subprocess.run(['git', '-C', repo, 'diff', '-U1', '--', path], capture_output=True, text=True, check=True).stdout


def split(text):
    lines = text.splitlines(keepends=True)
    head, hunks, cur = [], [], None
    for ln in lines:
        if ln.startswith('@@'):
            cur = [ln]
            hunks.append(cur)
        elif cur is None:
            head.append(ln)
        else:
            cur.append(ln)
    return head, hunks


def main():
    cmd, repo, path = sys.argv[1], sys.argv[2], sys.argv[3]
    head, hunks = split(diff(repo, path))
    if cmd == 'list':
        for i, h in enumerate(hunks):
            first = next((l for l in h[1:] if l[:1] in '+-'), '').rstrip('\n')
            print(i, h[0].rstrip('\n'), '|', first[:110])
        return
    keep = [int(x) for x in sys.argv[4].split(',')]
    patch = ''.join(head) + ''.join(''.join(hunks[i]) for i in keep)
    subprocess.run(['git', '-C', repo, 'apply', '--cached', '--recount', '-'], input=patch, text=True, check=True)
    print('staged', keep)


main()
