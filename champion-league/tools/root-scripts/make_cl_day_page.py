"""A Champion League Day page: the Day's results, each with its battle report, the table
after it, and the look back. Usage: python3 make_cl_day_page.py <day>

Reads cl-out/tournaments/cl-s1/state.json, cl-day<N>/summaries.json ({match id: html}),
cl-day<N>/notes.html (the look back) and writes cl-day<N>/index.html, which links each
report as reports/<match id>.html (built by build.cjs --standalone beside it)."""
import html
import json
import os
import sys

S = os.path.dirname(os.path.abspath(__file__))
DAY = int(sys.argv[1])
# An optional folder name: a Day played again gets its own page (cl-day1r), the first
# playing's folder stays as it was.
D = os.path.join(S, sys.argv[2] if len(sys.argv) > 2 else 'cl-day%d' % DAY)
state = json.load(open(os.path.join(S, 'cl-out', 'tournaments', 'cl-s1', 'state.json')))
summaries = json.load(open(os.path.join(D, 'summaries.json'))) if os.path.exists(os.path.join(D, 'summaries.json')) else {}
notes = open(os.path.join(D, 'notes.html')).read() if os.path.exists(os.path.join(D, 'notes.html')) else ''
faction_names = {p['faction']: p['factionName'] for p in json.load(open(os.path.join(S, 'presets5.json')))}
pot_of = {x['faction'] + '/' + x['formation']: i + 1 for i, pot in enumerate(state['pots']) for x in pot}
e = html.escape
HUB = 'https://claude.ai/artifact/GPzKCC6YdDX6zSz5LebK3q'

day = state['days'][DAY - 1]
key = lambda x: x['faction'] + '/' + x['formation']


def table_rows(days):
    rows = {}
    for i, ent in enumerate(state['entrants']):
        rows[key(ent)] = dict(e=ent, order=i, p=0, w=0, d=0, l=0, vf=0, va=0, pts=0)
    for d in days:
        for m in d['matches']:
            r = m.get('result')
            if not r:
                continue
            for army, side in ((m['a'], 0), (m['b'], 1)):
                row = rows[key(army)]
                row['p'] += 1
                row['vf'] += r['vp'][side]
                row['va'] += r['vp'][1 - side]
                if r['winner'] == side:
                    row['w'] += 1; row['pts'] += 3
                elif r['winner'] is None:
                    row['d'] += 1; row['pts'] += 1
                else:
                    row['l'] += 1
    return sorted(rows.values(), key=lambda r: (-r['pts'], -(r['vf'] - r['va']), -r['vf'], r['order']))


def result_card(m):
    r = m.get('result')
    a, b = m['a'], m['b']
    if not r:
        return ('<article class="match pending" id="%s"><div class="score"><span><b>%s</b><i>%s &middot; Pot %d &middot; Player A</i></span>'
                '<span class="vp num">v</span><span><b>%s</b><i>%s &middot; Pot %d &middot; Player B</i></span></div>'
                '<p class="how"><span class="mid">%s</span> to be played</p></article>'
                % (m['id'].lower(), e(a['name']), e(faction_names.get(a['faction'], a['faction'])), pot_of[key(a)],
                   e(b['name']), e(faction_names.get(b['faction'], b['faction'])), pot_of[key(b)], e(m['id'])))
    win = r['winner']
    cls = lambda side: ' class="won"' if win == side else ''
    report = 'reports/%s.html' % m['id'].lower()
    link = ('<p class="go"><a href="%s">Read the battle report &rarr;</a></p>' % report) if os.path.exists(os.path.join(D, report)) \
        else '<p class="go muted">Battle report being written</p>'
    how = 'drawn' if win is None else ('won on VP' if r['reason'] == 'VP' else 'won by ' + r['reason'])
    return ('<article class="match" id="%s">'
            '<div class="score"><span%s><b>%s</b><i>%s &middot; Pot %d &middot; Player A</i></span>'
            '<span class="vp num">%d&ndash;%d</span>'
            '<span%s><b>%s</b><i>%s &middot; Pot %d &middot; Player B</i></span></div>'
            '<p class="how"><span class="mid">%s</span> %s in Battle Round %d</p>'
            '%s%s</article>'
            % (m['id'].lower(), cls(0), e(a['name']), e(faction_names.get(a['faction'], a['faction'])), pot_of[key(a)],
               r['vp'][0], r['vp'][1],
               cls(1), e(b['name']), e(faction_names.get(b['faction'], b['faction'])), pot_of[key(b)],
               e(m['id']), how, r['round'],
               ('<p class="sum">%s</p>' % summaries[m['id']]) if m['id'] in summaries else '', link))


played = [d for d in state['days'][:DAY]]
rows = table_rows(played)
trs = []
for i, r in enumerate(rows, start=1):
    zone = 'z-direct' if i <= 8 else 'z-po' if i <= 24 else 'z-out'
    diff = r['vf'] - r['va']
    trs.append('<tr class="%s"><td class="r">%d</td><td>%s<span class="sub">%s</span></td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%s%d</td><td class="r pts">%d</td></tr>'
               % (zone, i, e(r['e']['name']), e(faction_names.get(r['e']['faction'], r['e']['faction'])),
                  r['p'], r['w'], r['d'], r['l'], r['vf'], r['va'], '+' if diff > 0 else '', diff, r['pts']))

results = [m.get('result') for m in day['matches'] if m.get('result')]
a_wins = sum(1 for r in results if r['winner'] == 0)
b_wins = sum(1 for r in results if r['winner'] == 1)
draws = sum(1 for r in results if r['winner'] is None)
avg_rounds = sum(r['round'] for r in results) / max(1, len(results))
complete = len(results) == len(day['matches'])
# The Day's map: each result records the one it was fought on (the maps rotate by matchday).
maps = sorted(set(r.get('map') or 'CROSSROADS' for r in results)) or ['CROSSROADS']
map_name = ' and '.join(m.title() for m in maps)
intro = ('Every army fought once today: %d league battles on %s, no doctrines. Each result links to its full battle report.' % (len(day['matches']), map_name)) if complete \
    else ('In progress: %d of %d battles played so far, on %s, no doctrines. This page fills in as the battles are played and their reports written.' % (len(results), len(day['matches']), map_name))
# A Day played again says so in its own words (intro.html beside notes.html).
if os.path.exists(os.path.join(D, 'intro.html')):
    intro = open(os.path.join(D, 'intro.html')).read().strip()
table_when = ('after Day %d' % DAY) if complete else ('during Day %d (%d of %d played)' % (DAY, len(results), len(day['matches'])))

page = '''<title>Champion League Day %(day)d%(again)s</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Saira+Condensed:wght@500;600;700&display=swap">
<style>
:root { --bg: #f2f3ef; --surface: #ffffff; --fg: #1b211f; --muted: #5a6460; --line: #d6dbd4; --line-soft: #e7eae4; --chip: #eceee8;
  --accent: #8a621a; --accent-soft: #f3ead6; --po: #1b6a60; --po-soft: #ddefea; --out: #8a938f;
  --display: "Saira Condensed", "Arial Narrow", "Roboto Condensed", sans-serif; --body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #121614; --surface: #1a1f1d; --fg: #e4e8e3; --muted: #9aa49f; --line: #2d3531; --line-soft: #232a27; --chip: #242b28;
  --accent: #d8ad55; --accent-soft: #33291a; --po: #6cc7b8; --po-soft: #183631; --out: #7c8580; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #121614; --surface: #1a1f1d; --fg: #e4e8e3; --muted: #9aa49f; --line: #2d3531; --line-soft: #232a27; --chip: #242b28;
  --accent: #d8ad55; --accent-soft: #33291a; --po: #6cc7b8; --po-soft: #183631; --out: #7c8580; color-scheme: dark; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font-family: var(--body); font-size: 15px; line-height: 1.5; }
.wrap { max-width: 920px; margin: 0 auto; padding-block: 28px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 32px; }
.wrap > * { min-width: 0; }
h1, h2, h3 { font-family: var(--display); margin: 0; text-wrap: balance; letter-spacing: 0.01em; }
h1 { font-size: 2.4rem; font-weight: 700; line-height: 1.05; }
h2 { font-size: 1.05rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); padding-bottom: 6px; border-bottom: 2px solid var(--accent); }
h3 { font-size: 1.15rem; font-weight: 600; }
p { margin: 0; max-width: 68ch; }
section { display: grid; gap: 14px; }
a { color: inherit; text-underline-offset: 3px; text-decoration-color: var(--line); }
a:hover { text-decoration-color: var(--accent); }
.num { font-variant-numeric: tabular-nums; }
.muted { color: var(--muted); }
.eyebrow { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
.head { display: grid; gap: 10px; }
.facts { display: flex; flex-wrap: wrap; gap: 8px 28px; margin: 4px 0 0; }
.facts div { display: grid; }
.facts dt { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); order: 2; }
.facts dd { margin: 0; font-family: var(--display); font-size: 1.6rem; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.matches { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%%, 420px), 1fr)); gap: 12px; }
.match { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 12px 14px; display: grid; gap: 8px; align-content: start; scroll-margin-top: 12px; }
.score { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 10px; align-items: center; }
.score > span:first-child { text-align: left; } .score > span:last-child { text-align: right; }
.score b { display: block; font-weight: 500; line-height: 1.25; }
.score i { display: block; font-style: normal; font-size: 0.74rem; color: var(--muted); }
.score .won b { font-weight: 700; color: var(--accent); }
.vp { font-family: var(--display); font-size: 1.7rem; font-weight: 700; white-space: nowrap; }
.how { font-size: 0.82rem; color: var(--muted); }
.how .mid { font-weight: 600; color: var(--fg); margin-right: 4px; }
.sum { font-size: 0.9rem; }
.go { font-size: 0.88rem; font-weight: 600; }
.match.pending { background: transparent; border-style: dashed; }
.match.pending b { color: var(--muted); }
.notes { background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 6px; padding: 14px 16px; display: grid; gap: 10px; }
.notes ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
.scroll { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 4px 8px; }
table.league { border-collapse: collapse; width: 100%%; font-size: 0.88rem; min-width: 520px; }
table.league th, table.league td { padding: 6px; text-align: left; border-bottom: 1px solid var(--line-soft); }
table.league th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 600; }
table.league .r { text-align: right; font-variant-numeric: tabular-nums; }
table.league .pts { font-weight: 700; }
table.league .sub { display: block; font-size: 0.75rem; color: var(--muted); }
table.league tr.z-direct td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
table.league tr.z-po td:first-child { box-shadow: inset 3px 0 0 var(--po); }
table.league tr.z-out td:first-child { box-shadow: inset 3px 0 0 var(--out); }
table.league tr:nth-child(8) td, table.league tr:nth-child(24) td { border-bottom: 2px solid var(--line); }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.82rem; color: var(--muted); }
.key { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
.k-direct { background: var(--accent); } .k-po { background: var(--po); } .k-out { background: var(--out); }
@media (max-width: 480px) { h1 { font-size: 2rem; } .vp { font-size: 1.4rem; } }
</style>
<main class="wrap">
  <header class="head">
    <span class="eyebrow"><a href="%(hub)s">Champion League Season 1</a> &middot; Day %(day)d of 13</span>
    <h1>%(label)s</h1>
    <p>%(intro)s</p>
    <dl class="facts">
      <div><dt>Played</dt><dd>%(np)d<span class="muted">/%(n)d</span></dd></div>
      <div><dt>Player A won</dt><dd>%(aw)d</dd></div>
      <div><dt>Player B won</dt><dd>%(bw)d</dd></div>
      <div><dt>Drawn</dt><dd>%(dr)d</dd></div>
      <div><dt>Battle Rounds, average</dt><dd>%(avg).1f</dd></div>
    </dl>
  </header>
  %(notes)s
  <section aria-labelledby="res-h">
    <h2 id="res-h">Results</h2>
    <div class="matches">%(cards)s</div>
  </section>
  <section aria-labelledby="lt-h">
    <h2 id="lt-h">League table %(when)s</h2>
    <div class="legend"><span><i class="key k-direct"></i>1st&ndash;8th: round of 16</span><span><i class="key k-po"></i>9th&ndash;24th: play-off</span><span><i class="key k-out"></i>25th&ndash;48th: out</span></div>
    <div class="scroll"><table class="league"><thead><tr><th class="r">#</th><th>Army</th><th class="r">P</th><th class="r">W</th><th class="r">D</th><th class="r">L</th><th class="r">VP+</th><th class="r">VP&minus;</th><th class="r">+/&minus;</th><th class="r">Pts</th></tr></thead><tbody>%(rows)s</tbody></table></div>
  </section>
</main>
''' % dict(day=DAY, again=(' Replayed' if len(sys.argv) > 2 else ''), hub=HUB, intro=intro, np=len(results), when=table_when, label=e(day['label']), n=len(day['matches']), aw=a_wins, bw=b_wins, dr=draws, avg=avg_rounds,
           notes=('<section class="notes" aria-labelledby="nb-h"><h2 id="nb-h">Looking back on Day %d</h2>%s</section>' % (DAY, notes)) if notes else '',
           cards=''.join(result_card(m) for m in day['matches']), rows=''.join(trs))
os.makedirs(D, exist_ok=True)
open(os.path.join(D, 'index.html'), 'w').write(page)
print('ok', os.path.join(D, 'index.html'), len(page))
