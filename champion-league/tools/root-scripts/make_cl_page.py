"""The Champion League Season 1 hub page, from the league's state.json and the Day pages
published so far (cl_day_links.json: {"1": "https://claude.ai/artifact/..."}).
Built on the format page (champion-league-format.html), updated to 48 armies."""
import html
import json
import os
import sys

S = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(S, 'cl-out', 'tournaments', 'cl-s1', 'state.json')
LINKS = os.path.join(S, 'cl_day_links.json')
e = html.escape

state = json.load(open(STATE))
links = json.load(open(LINKS)) if os.path.exists(LINKS) else {}
page = open(os.path.join(S, 'champion-league-format.html')).read()


def swap(old, new, count=1):
    global page
    assert page.count(old) == count, (old[:80], page.count(old))
    page = page.replace(old, new)


# ---- Table rows and Day list from the state ----
def table_rows():
    rows = {}
    for i, ent in enumerate(state['entrants']):
        rows[ent['faction'] + '/' + ent['formation']] = dict(e=ent, order=i, p=0, w=0, d=0, l=0, vf=0, va=0, pts=0)
    for day in state['days']:
        for m in day['matches']:
            r = m.get('result')
            if not r:
                continue
            for army, side in ((m['a'], 0), (m['b'], 1)):
                row = rows[army['faction'] + '/' + army['formation']]
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


played_days = [d for d in state['days'] if all(m.get('result') for m in d['matches'])]
DAY_NAMES = [d['label'] for d in state['days']] + ['Play-off', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']
DAY_SIZES = ['24 battles'] * len(state['days']) + ['8 ties, best of 3', '8 ties, best of 3', '4 ties, best of 3', '2 ties, best of 3', '1 tie, best of 3']


def day_list():
    items = []
    next_open = len(played_days) + 1
    for n, (name, size) in enumerate(zip(DAY_NAMES, DAY_SIZES), start=1):
        if str(n) in links and n == next_open and n <= len(state['days']):
            done = sum(1 for m in state['days'][n - 1]['matches'] if m.get('result'))
            status = '<a href="%s">In progress: %d of %d played</a>' % (e(links[str(n)]), done, len(state['days'][n - 1]['matches']))
            cls = 'next'
        elif str(n) in links:
            status = '<a href="%s">Results and battle reports</a>' % e(links[str(n)])
            cls = 'done'
        elif n <= len(played_days):
            status = 'Played'
            cls = 'done'
        elif n == next_open:
            status = 'Next'
            cls = 'next'
        else:
            status = ''
            cls = ''
        # A Day played again keeps its first playing as an archive ("1-archive").
        if str(n) + '-archive' in links:
            status += ' &middot; <a href="%s">First playing (archive)</a>' % e(links[str(n) + '-archive'])
        items.append('<li class="%s"><span class="dn">Day %d</span><span class="dl">%s</span><span class="ds">%s</span><span class="dst">%s</span></li>'
                     % (cls, n, e(name), e(size), status))
    return '<ol class="days">%s</ol>' % ''.join(items)


def table_html():
    played = sum(1 for d in state['days'] for m in d['matches'] if m.get('result'))
    if not played:
        return ''
    when = 'after Day %d' % len(played_days)
    if len(played_days) < len(state['days']):
        cur = state['days'][len(played_days)]
        done = sum(1 for m in cur['matches'] if m.get('result'))
        if done:
            when = 'during Day %d (%d of %d played)' % (len(played_days) + 1, done, len(cur['matches']))
    rows = table_rows()
    trs = []
    for i, r in enumerate(rows, start=1):
        zone = 'z-direct' if i <= 8 else 'z-po' if i <= 24 else 'z-out'
        diff = r['vf'] - r['va']
        trs.append('<tr class="%s"><td class="r">%d</td><td>%s<span class="sub">%s</span></td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%d</td><td class="r">%s%d</td><td class="r pts">%d</td></tr>'
                   % (zone, i, e(r['e']['name']), e(r['e'].get('factionName', r['e']['faction'].replace('_', ' ').title())),
                      r['p'], r['w'], r['d'], r['l'], r['vf'], r['va'], '+' if diff > 0 else '', diff, r['pts']))
    return ('<section aria-labelledby="lt-h"><h2 id="lt-h">League table %s</h2>'
            '<div class="legend"><span><i class="key k-direct"></i>1st&ndash;8th: round of 16</span><span><i class="key k-po"></i>9th&ndash;24th: play-off</span><span><i class="key k-out"></i>25th&ndash;48th: out</span></div>'
            '<div class="scroll lt"><table class="league"><thead><tr><th class="r">#</th><th>Army</th><th class="r">P</th><th class="r">W</th><th class="r">D</th><th class="r">L</th><th class="r">VP+</th><th class="r">VP&minus;</th><th class="r">+/&minus;</th><th class="r">Pts</th></tr></thead><tbody>%s</tbody></table></div>'
            '<p class="muted">3 points a win, 1 a battle drawn on VP; level on points, VP difference, then VP scored.</p></section>'
            % (when, ''.join(trs)))


def pots_html():
    cols = []
    for i, pot in enumerate(state['pots'], start=1):
        cols.append('<div class="pot"><h3>Pot %d</h3><ol>%s</ol></div>' % (i, ''.join('<li>%s</li>' % e(x['name']) for x in pot)))
    return '<div class="potlist">%s</div>' % ''.join(cols)


# ---- Edits to the format page ----
swap('<span class="eyebrow">Divine Empires: 1899 &middot; proposed format, not built yet</span>',
     '<span class="eyebrow">Divine Empires: 1899 &middot; %s</span>' % ('drawn, Day 1 next' if not played_days else 'Day %d of 13 played' % len(played_days)))
swap('<p>Forty armies in one league table. Every army plays eight battles against eight different opponents; the table then sends the top 24 into a seeded best-of-3 knockout and the bottom 16 home.</p>',
     '<p>Every preset army, 48 of them, in one league table. Each plays eight battles against eight different opponents over eight matchdays; the table then sends the top 24 into a seeded best-of-3 knockout and the bottom 24 home. The season runs one Day at a time, and every battle gets a full battle report.</p>')
swap('<div><dt>Armies</dt><dd>40</dd></div>', '<div><dt>Armies</dt><dd>48</dd></div>')
swap('<div><dt>Battles in all</dt><dd>~220</dd></div>', '<div><dt>Battles in all</dt><dd>238&ndash;261</dd></div>')
swap("<div><dt>At today's pace</dt><dd>~5 h</dd></div>", '<div><dt>Days</dt><dd>13</dd></div>')
swap('<span class="sa num">40 armies</span><span class="sb num">160 battles</span>', '<span class="sa num">48 armies</span><span class="sb num">192 battles</span>')
swap('    <p class="muted">A league battle is a single battle. Every knockout tie, the play-off included, is best of 3.</p>\n  </section>',
     '    <p class="muted">A league battle is a single battle. Every knockout tie, the play-off included, is best of 3.</p>\n  </section>\n\n'
     '  <section aria-labelledby="days-h">\n    <h2 id="days-h">The Days</h2>\n    <p>One Day at a time: its battles are played, each gets its battle report, and the Day is looked at before the next is played.</p>\n    '
     + day_list() + '\n  </section>\n\n  ' + table_html())
swap('Eight battles, two opponents from each pot. Finishes \' + ord(p) + \' of 40.', 'Eight battles, two opponents from each pot. Finishes \' + ord(p) + \' of 48.')
swap("{ cls: 'z-out', from: 25, to: 40, title: '25th–40th', what: 'out after the league' }",
     "{ cls: 'z-out', from: 25, to: 48, title: '25th–48th', what: 'out after the league' }")
swap('aria-label="An army draws two opponents from each of four pots of ten: one it fights as army A, one as army B. Armies of its own faction are never drawn."',
     'aria-label="An army draws two opponents from each of four pots of twelve: one it fights as army A, one as army B. Armies of its own faction are never drawn."')
swap('var rows = [44, 112, 180, 248], x0 = 204, dx = 36, r = 8;', 'var rows = [44, 112, 180, 248], x0 = 204, dx = 30, r = 8;')
swap("svg.appendChild(el('text', { x: x0 + 9 * dx + 18, y: y + 5, 'class': 't-pot' }, 'Pot ' + (i + 1)));",
     "svg.appendChild(el('text', { x: x0 + 11 * dx + 18, y: y + 5, 'class': 't-pot' }, 'Pot ' + (i + 1)));")
swap('for (var j = 0; j < 10; j++) {', 'for (var j = 0; j < 12; j++) {')
swap("'10 armies per pot'", "'12 armies per pot'")
swap('<figcaption>The 40 armies are split into four pots of ten. Each army draws two opponents from every pot, its own included: one it fights as army A and one as army B, so each army fights four battles from each side. No pair meets twice, and armies of the same faction never meet, which matters most for the Covenant\'s and the Infernal Congregations\' many orders and cults.</figcaption>\n    </figure>',
     '<figcaption>The 48 armies were dealt into four pots of twelve at random, each faction spread across the pots as evenly as it goes (the Covenant\'s eight orders two to a pot). Each army meets two armies from every pot, its own included: one as army A and one as army B, so four battles from each side. No pair meets twice and armies of one faction never meet. Each matchday every army fights once.</figcaption>\n    </figure>\n    '
     + pots_html())
swap('<tr><td>League</td><td class="r">&ndash;</td><td class="r">160</td></tr>', '<tr><td>League</td><td class="r">&ndash;</td><td class="r">192</td></tr>')
swap('<tfoot><tr><td>Total</td><td class="r">23</td><td class="r">206&ndash;229</td></tr></tfoot>', '<tfoot><tr><td>Total</td><td class="r">23</td><td class="r">238&ndash;261</td></tr></tfoot>')
swap('<p class="muted" style="font-size:0.85rem">Today\'s test battles ran about three every four minutes with three at once: roughly 5 hours for the whole season.</p>',
     '<p class="muted" style="font-size:0.85rem">Three battles at a time, each recorded with its board after every round for its report.</p>')
old_open = page[page.index('      <div class="card open">'):page.index('    </div>\n  </section>\n</main>')]
page = page.replace(old_open,
    '      <div class="card">\n        <h3>Settled</h3>\n        <ul>\n'
    '          <li>48 armies: every preset in the game.</li>\n'
    '          <li>Pots drawn at random (seed %d), each faction spread across them.</li>\n'
    '          <li>Days 1&ndash;8 are the matchdays; Days 9&ndash;13 the play-off, round of 16, quarter-finals, semi-finals and final.</li>\n'
    '        </ul>\n      </div>\n'
    '      <div class="card">\n        <h3>Between Days</h3>\n        <p>After each Day the results are read for bugs and AI mistakes. A fix that changes how a battle plays is made before the next Day; a battle a bug decided is played again.</p>\n      </div>\n' % state['seed'])
# Styles for the new parts.
swap('@media (max-width: 480px) { h1 { font-size: 2.05rem; } .facts dd { font-size: 1.45rem; } }',
     '''.days { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.days li { display: grid; grid-template-columns: 4.2em minmax(0, 1fr) auto; column-gap: 12px; row-gap: 2px; align-items: baseline;
  background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 8px 12px; }
.days .dn { font-family: var(--display); font-weight: 600; color: var(--muted); }
.days .dl { font-weight: 600; }
.days .ds { font-size: 0.82rem; color: var(--muted); }
.days .dst { grid-column: 2 / -1; font-size: 0.85rem; }
.days li.done { border-left: 3px solid var(--accent); }
.days li.next { border-left: 3px solid var(--po); }
.days li.next .dst { color: var(--po); font-weight: 600; }
.potlist { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 720px) { .potlist { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pot { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; display: grid; gap: 6px; align-content: start; }
.pot ol { margin: 0; padding-left: 20px; font-size: 0.86rem; display: grid; gap: 2px; }
.scroll.lt { padding: 4px 8px; }
table.league { border-collapse: collapse; width: 100%; font-size: 0.88rem; min-width: 520px; }
table.league th, table.league td { padding: 6px 6px; text-align: left; border-bottom: 1px solid var(--line-soft); }
table.league th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 600; }
table.league .r { text-align: right; font-variant-numeric: tabular-nums; }
table.league .pts { font-weight: 700; }
table.league .sub { display: block; font-size: 0.75rem; color: var(--muted); }
table.league tr.z-direct td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
table.league tr.z-po td:first-child { box-shadow: inset 3px 0 0 var(--po); }
table.league tr.z-out td:first-child { box-shadow: inset 3px 0 0 var(--out); }
table.league tr:nth-child(8) td, table.league tr:nth-child(24) td { border-bottom: 2px solid var(--line); }
.key { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
.k-direct { background: var(--accent); } .k-po { background: var(--po); } .k-out { background: var(--out); }
@media (max-width: 480px) { h1 { font-size: 2.05rem; } .facts dd { font-size: 1.45rem; } }''')
# The maps rotate by matchday (tournaments/champion_league_s1.json mapRotation).
swap('<li>Every battle on Crossroads, every army without a doctrine, as in the current Season 1 settings.</li>',
     '<li>The map rotates by matchday: Crossroads on Days 1, 4 and 7, Acropolis on Days 2, 5 and 8, Triple Hills on Days 3 and 6, and the knockout on Crossroads. Every army fights without a doctrine.</li>')
swap('<h2 id="rules-h">Scoring, cost and what is still open</h2>', '<h2 id="rules-h">Scoring, cost and settled rules</h2>')
out = os.path.join(S, 'champion-league.html')
open(out, 'w').write(page)
print('ok', out, len(page), 'days played', len(played_days))
