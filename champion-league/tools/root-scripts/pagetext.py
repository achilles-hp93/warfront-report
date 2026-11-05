import re,sys,html
s=open(sys.argv[1]).read()
s=re.sub(r'data:[^"\')]+','',s)
s=re.sub(r'<script.*?</script>','',s,flags=re.S)
s=re.sub(r'<style.*?</style>','',s,flags=re.S)
s=re.sub(r'<[^>]+>','\n',s)
s=html.unescape(s)
lines=[l.strip() for l in s.split('\n') if l.strip()]
open(sys.argv[2],'w').write('\n'.join(lines))
print(len(lines))
