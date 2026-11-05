import glob, json, sys
root = sys.argv[1]
OPS = {'force_test', 'apply_affliction', 'seize_control', 'forced_move'}
for f in sorted(glob.glob(root + '/data/editions/fantasy/magic/**/*.json', recursive=True)):
    try:
        d = json.load(open(f))
    except Exception:
        continue
    if not isinstance(d, dict):
        continue
    effs = d.get('effects') or []
    if not any(isinstance(e, dict) and e.get('op') in OPS for e in effs):
        continue
    print(d.get('name'), '|', d.get('target'), '|', [(e.get('op'), e.get('target'), e.get('if_oversoul') or e.get('unless_oversoul')) for e in effs if isinstance(e, dict)])
