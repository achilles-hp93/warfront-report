#!/usr/bin/env python3
"""Replace one test suite file's source inside a built warfront-fantasy.html (scratch, aibugs).

usage: inject_test.py <html> <repo root> <suite path under tests/suites, e.g. ai/188_x.js> [...]
Saves a rebuild while a test is being written; the final gate runs on a real build.
"""
import os
import re
import sys

html_path, root = sys.argv[1], sys.argv[2]
text = open(html_path, encoding='utf-8').read()
for rel in sys.argv[3:]:
    header = '// MODULE: suites/' + rel + '\n'
    start = text.find(header)
    if start < 0 or text.find(header, start + 1) >= 0:
        sys.exit('expected exactly one module header for ' + rel)
    body_start = text.index('\n', text.index('\n', start) + 1) + 1  # past the dashed line after the header
    nxt = re.compile(r'\n// -{73}\n// MODULE: ').search(text, body_start)
    if not nxt:
        sys.exit('no next module after ' + rel)
    src = open(os.path.join(root, 'tests', 'suites', rel), encoding='utf-8').read()
    text = text[:body_start] + src + text[nxt.start():]
    print('injected', rel)
open(html_path, 'w', encoding='utf-8').write(text)
