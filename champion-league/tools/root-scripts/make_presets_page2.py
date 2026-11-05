"""Write the preset-army comps page from presets.json (dumped from the built game)."""
import html
import json
import os

S = os.path.dirname(os.path.abspath(__file__))
presets = json.load(open(os.path.join(S, 'presets2.json')))
MAX_RP = 250
e = html.escape

TIER_CLASS = {'EPIC HERO': 't-hero', 'EPIC': 't-epic', 'ELITE': 't-elite', 'SPECIALIST': 't-spec', 'STANDARD': 't-std'}
TIER_LABEL = {'EPIC HERO': 'Epic Hero', 'EPIC': 'Epic', 'ELITE': 'Elite', 'SPECIALIST': 'Specialist', 'STANDARD': 'Standard'}


def rows_for(p):
    """Deck order, a CHARACTER's squad straight after it, identical plain units folded."""
    units = p['units']
    lead = {int(k): int(v) for k, v in (p['leaderMap'] or {}).items()}
    led_by = {v: k for k, v in lead.items()}
    # Which deck slots are the copies added in the 250 growth: the last n of each id.
    new_slots = set()
    for uid, n in (p.get('added') or {}).items():
        slots = [i for i, u in enumerate(units) if u['id'] == uid]
        new_slots.update(slots[-n:])
    rows, placed, groups = [], set(), {}
    for i, u in enumerate(units):
        if i in placed or i in led_by:
            continue
        gear = u['gear']['name'] if u['gear'] else None
        if i in lead or i == p['marshalIndex'] or u['character']:
            rows.append({'slots': [i], 'unit': u, 'joined': False})
            placed.add(i)
            if i in lead:
                s = lead[i]
                rows.append({'slots': [s], 'unit': units[s], 'joined': True, 'leader': u['name']})
                placed.add(s)
            continue
        key = (u['id'], gear)
        if key in groups:
            groups[key]['slots'].append(i)
        else:
            groups[key] = {'slots': [i], 'unit': u, 'joined': False}
            rows.append(groups[key])
        placed.add(i)
    for r in rows:
        r['new'] = sum(1 for s in r['slots'] if s in new_slots)
    return rows


def row_html(r, p):
    u = r['unit']
    q = len(r['slots'])
    gear_rp = u['gear']['rp'] if u['gear'] else 0
    each = u['rp'] + gear_rp
    total = q * each
    notes = []
    if p['marshalIndex'] in r['slots']:
        notes.append('<span class="tag marshal">Marshal</span>')
    if r['new']:
        notes.append('<span class="tag new">%s</span>' % ('New' if r['new'] == q else '+%d new' % r['new']))
    if r['joined']:
        notes.append('<span class="sub">led by %s</span>' % e(r['leader']))
    if u['gear']:
        notes.append('<span class="sub">gear: %s (%d RP)</span>' % (e(gear_title(u['gear']['name'])), gear_rp))
    name = ('%d&times; ' % q if q > 1 else '') + e(u['name'])
    if q > 1 and gear_rp:
        breakdown = '%d &times; (%d + %d)' % (q, u['rp'], gear_rp)
    elif q > 1:
        breakdown = '%d &times; %d' % (q, u['rp'])
    elif gear_rp:
        breakdown = '%d + %d gear' % (u['rp'], gear_rp)
    else:
        breakdown = ''
    cls = ' class="joined"' if r['joined'] else ''
    return (
        '<tr%s><td class="unit"><span class="uname">%s</span>%s</td>'
        '<td class="tier"><span class="chip %s">%s</span></td>'
        '<td class="rp"><span class="num">%d</span>%s</td></tr>'
    ) % (cls, name, ('<span class="notes">' + ' '.join(notes) + '</span>') if notes else '',
         TIER_CLASS[u['tier']], TIER_LABEL[u['tier']], total,
         ('<span class="each">%s</span>' % breakdown) if breakdown else '')


def gear_title(name):
    if not name.isupper():
        return name
    small = {'of', 'the', 'and', 'a', 'an', 'in', 'on'}
    words = name.title().split(' ')
    return ' '.join(w.lower() if i and w.lower() in small else w for i, w in enumerate(words))


def bar(rp):
    pct = min(100, rp * 100.0 / MAX_RP)
    return '<span class="bar" aria-hidden="true"><span style="width:%.1f%%"></span></span>' % pct


by_faction = {}
for p in presets:
    by_faction.setdefault(p['factionName'], []).append(p)
factions = sorted(by_faction, key=lambda f: f.lstrip('Ā').replace('Ā', 'A'))
factions = sorted(by_faction, key=lambda f: f.replace('Ā', 'A'))

summary_rows, sections = [], []
for f in factions:
    summary_rows.append('<tr class="fhead"><th colspan="4" scope="rowgroup">%s</th></tr>' % e(f))
    cards = []
    for p in by_faction[f]:
        rows = rows_for(p)
        total = sum(len(r['slots']) * (r['unit']['rp'] + (r['unit']['gear']['rp'] if r['unit']['gear'] else 0)) for r in rows)
        assert total == p['rp'], (p['id'], total, p['rp'])
        assert sum(len(r['slots']) for r in rows) == len(p['units']), p['id']
        marshal = p['units'][p['marshalIndex']]['name'] if p['marshalIndex'] is not None else 'none'
        sub = p['subfaction'] or 'No subfaction'
        removed = ', '.join('%s%s' % ('%d&times; ' % n if n > 1 else '', e(uid.replace('_', ' ').title())) for uid, n in (p.get('removed') or {}).items())
        summary_rows.append(
            '<tr><td><a href="#%s">%s</a>%s</td><td>%s</td>'
            '<td class="num-c">%d</td><td class="rp-c"><span class="num">%d</span>%s</td></tr>'
            % (p['id'], e(p['name']) + (' <span class="tag new">New</span>' if p.get('isNew') else ''), ('<span class="sub">%s</span>' % e(p['subfaction'])) if p['subfaction'] else '', e(p['fielded']), len(p['units']), p['rp'], bar(p['rp'])))
        cards.append(
            '<section class="army" id="%s" aria-labelledby="%s-h">'
            '<header><div class="head-l"><h3 id="%s-h">%s</h3>'
            '<dl class="meta"><div><dt>Subfaction</dt><dd>%s</dd></div><div><dt>Doctrine</dt><dd>%s</dd></div>'
            '<div><dt>Marshal</dt><dd>%s</dd></div></dl></div>'
            '<div class="head-r"><span class="big num">%d</span><span class="of">/ %d RP</span>%s<span class="cnt">%d units</span></div></header>'
            '<div class="tbl"><table><thead><tr><th scope="col">Unit</th><th scope="col">Tier</th><th scope="col" class="rp">RP</th></tr></thead>'
            '<tbody>%s</tbody><tfoot><tr><td colspan="2">Total</td><td class="rp"><span class="num">%d</span></td></tr></tfoot></table></div>%s</section>'
            % (p['id'], p['id'], p['id'], e(p['name']) + (' <span class="tag new">New</span>' if p.get('isNew') else ''), e(sub), e(p['fielded']), e(marshal), p['rp'], MAX_RP, bar(p['rp']),
               len(p['units']), ''.join(row_html(r, p) for r in rows), p['rp'],
               ('<p class="removed">Removed since the last version: %s</p>' % removed) if removed else ''))
    sections.append('<section class="faction"><h2>%s</h2>%s</section>' % (e(f), ''.join(cards)))

page = open(os.path.join(S, 'presets_template2.html')).read()
page = page.replace('{{SUMMARY}}', ''.join(summary_rows)).replace('{{SECTIONS}}', ''.join(sections))
page = page.replace('{{COUNT}}', str(len(presets)))
page = page.replace('{{MINRP}}', str(min(p['rp'] for p in presets))).replace('{{MAXRP}}', str(max(p['rp'] for p in presets)))
open(os.path.join(S, 'preset-armies.html'), 'w').write(page)
print('ok', len(page))
