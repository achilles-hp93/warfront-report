import json, sys
d = json.load(open(sys.argv[1]))
p = d.get('probe') or {}
only = sys.argv[2] if len(sys.argv) > 2 else None
for e in p.get('leaves', []):
    if only and only not in json.dumps(e):
        continue
    if 'error' in e:
        print('ERR', e); continue
    st, th = e['stay'], e['there']
    keys = sorted(set(st) | set(th), key=lambda k: -abs(th.get(k, 0) - st.get(k, 0)))
    diff = ', '.join('%s %+.1f' % (k, th.get(k, 0) - st.get(k, 0)) for k in keys if k not in ('total', 'threats_raw') and abs(th.get(k, 0) - st.get(k, 0)) > 0.05)
    print('R%s %s %s obj%s oc%s %s -> %s score %s | stay %s there %s | presence %s gt %s bought %s' % (
        e['round'], e['unit'], e['at'], e['obj'], e['oc'], e['type'], e['dest'], e.get('destScore'), st.get('total'), th.get('total'), e['presence'], e['gt'], e['bought']))
    print('     diff:', diff)
