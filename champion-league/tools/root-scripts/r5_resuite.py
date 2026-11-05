import sys
# usage: r5_resuite.py <html> <repo> <suite rel path>...  - swap embedded test suite
# files in a built page for their current text (the build embeds each once, behind a
# "// MODULE: suites/<path>" header).
html, repo = sys.argv[1], sys.argv[2]
s = open(html, encoding='utf-8').read()
bar = '// ' + '-' * 73
for sf in sys.argv[3:]:
    head = '\n%s\n// MODULE: suites/%s\n%s\n' % (bar, sf, bar)
    if s.count(head) != 1:
        sys.exit('header for %s found %d times' % (sf, s.count(head)))
    start = s.index(head) + len(head)
    end = s.index('\n' + bar + '\n// MODULE: ', start)
    new = open(repo + '/tests/suites/' + sf, encoding='utf-8').read()
    s = s[:start] + new + s[end:]
    print('swapped', sf)
open(html, 'w', encoding='utf-8').write(s)
