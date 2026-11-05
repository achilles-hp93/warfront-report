import re,sys
words=sys.argv[1:]
sec=None
for line in open('doc/fantasy-naming-glossary.md',encoding='utf-8'):
    if line.startswith('## '): sec=line[3:].strip(); continue
    if not line.startswith('| ') or line.startswith('| Name') or line.startswith('| ---'): continue
    cols=[c.strip() for c in line.split(' | ')]
    name=cols[0].lstrip('| ').strip(); fac=cols[1] if len(cols)>1 else ''
    for w in words:
        if re.search(r'\b'+re.escape(w),name,re.I):
            print(f'[{w}] {sec} :: {name} :: {fac} :: {cols[2][:110] if len(cols)>2 else ""}')
