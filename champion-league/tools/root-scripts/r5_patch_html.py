import sys
# usage: r5_patch_html.py <html> <old-file> <new-file> [count]
html, old_f, new_f = sys.argv[1], sys.argv[2], sys.argv[3]
want = int(sys.argv[4]) if len(sys.argv) > 4 else None
s = open(html, encoding='utf-8').read()
old = open(old_f, encoding='utf-8').read()
new = open(new_f, encoding='utf-8').read()
n = s.count(old)
print('occurrences', n)
if want is not None and n != want:
    sys.exit('expected %d' % want)
if n == 0:
    sys.exit('not found')
s = s.replace(old, new)
open(html, 'w', encoding='utf-8').write(s)
print('patched')
