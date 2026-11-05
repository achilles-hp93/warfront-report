"""Write the preset-army comps page from presets5.json (dumped from the built game by p_dump_presets.js)."""
import html
import json
import os

S = os.path.dirname(os.path.abspath(__file__))
presets = json.load(open(os.path.join(S, 'presets5.json')))
previous = {p['id']: p for p in json.load(open(os.path.join(S, 'presets3.json')))}
MAX_RP = 250
e = html.escape

# Presets added since the 27 October page, and the source behind each picked name.
NAMED_FOR = {
    'soudarion_cortege': 'The <i>soudarion</i>, the face-cloth Lazarus wore out of the tomb (John 11:44); a cortege is a funeral procession, for an Order that comes back from the grave.',
    'popinjay_guild': 'The popinjay, the wooden bird the Saint Sebastian shooting guilds shot from a pole each year; whoever brought it down was the guild&rsquo;s king for the year.',
    'chonae_wing': 'Chonae (Colossae, Phrygia), where Michael split the rock and turned the flood from his church; the Orthodox Church keeps the Miracle at Chonae on 6 September.',
    'magdeburg_warhost': 'Magdeburg, Otto I&rsquo;s chosen city (archbishopric 968, his tomb), whose town law became the charter of hundreds of trading towns.',
    'glandore_breakers': '<i>Tonn Chl&iacute;odhna</i>, Cliodhna&rsquo;s Wave, one of the three great waves of Irish legend, breaks in Glandore Harbour, Co. Cork, where she drowned.',
    'alea_iacta': '&ldquo;The die is cast&rdquo;, at the Rubicon in 49 BC (Suetonius, <i>Divus Iulius</i> 32).',
    'scorpion_shields': 'The scorpion device on Praetorian shields, Tiberius&rsquo;s birth sign.',
    'caerfyrddin_fencibles': 'Caerfyrddin (Carmarthen, Roman Moridunum), &ldquo;Myrddin&rsquo;s fort&rdquo; and Merlin&rsquo;s birthplace in medieval telling; fencibles were Britain&rsquo;s home-defence regiments raised for a war&rsquo;s duration (1759&ndash;1802).',
    'horns_of_hattin': 'The twin-peaked hill above Tiberias where Saladin destroyed the Imperial army in 1187; the lore keeps the battle.',
    'opoki_hundred': 'The <i>Ivanskoye sto</i>, the merchants&rsquo; guild at St John&rsquo;s on Opoki, whose trade court the tysyatsky chaired.',
    'cosan_si_host': 'The Irish fairy paths (<i>cos&aacute;n s&iacute;</i>) that run between raths; a house built across one is cursed, and the Waymarshal keeps the roads.',
    'celeritas_squadron': '<i>Celeritas Caesaris</i>, his proverbial speed: he covered a hundred miles a day on the road (Suetonius, <i>Divus Iulius</i> 57).',
    'alembic_brigade': '<i>Al-anb&imacr;q</i>, the distilling still of Jabir ibn Hayyan&rsquo;s alchemists, which gave English the word &ldquo;alembic&rdquo;.',
}
NEW = set(NAMED_FOR)
assert NEW <= {p['id'] for p in presets}, NEW - {p['id'] for p in presets}
REMOVED = [previous[i]['name'] for i in previous if i not in {p['id'] for p in presets}]


def unit_ids(p):
    return sorted(u['id'] for u in p['units'])


def changes(p):
    """What changed since the 27 October page, as '+2 Custos, -1 Strikers'."""
    old = previous.get(p['id'])
    if not old or p['id'] in NEW:
        return None
    before, after = {}, {}
    for u in old['units']:
        before[u['name']] = before.get(u['name'], 0) + 1
    for u in p['units']:
        after[u['name']] = after.get(u['name'], 0) + 1
    out = []
    for n in sorted(set(before) | set(after)):
        d = after.get(n, 0) - before.get(n, 0)
        if d:
            out.append('%s%d %s' % ('+' if d > 0 else '&minus;', abs(d), e(n)))
    if (old.get('subfaction') or None) != (p.get('subfaction') or None):
        out.append('now %s' % e(p['subfaction'] or 'no subfaction'))
    def pairs(q):
        return {(q['units'][int(k)]['name'], q['units'][int(v)]['name']) for k, v in (q['leaderMap'] or {}).items()}
    if not out:
        out += ['%s now leads %s' % (e(a), e(b)) for a, b in sorted(pairs(p) - pairs(old))]
        out += ['%s no longer leads %s' % (e(a), e(b)) for a, b in sorted(pairs(old) - pairs(p))]
    return out or None


TIER_CLASS = {'EPIC HERO': 't-hero', 'EPIC': 't-epic', 'ELITE': 't-elite', 'SPECIALIST': 't-spec', 'STANDARD': 't-std'}
TIER_LABEL = {'EPIC HERO': 'Epic Hero', 'EPIC': 'Epic', 'ELITE': 'Elite', 'SPECIALIST': 'Specialist', 'STANDARD': 'Standard'}


def transports(p):
    """{transportIdx: [passenger idx, ...]} in deck order."""
    out = {}
    for k, ti in sorted(((int(k), int(v)) for k, v in (p['transport'] or {}).items())):
        out.setdefault(ti, []).append(k)
    return out


def rows_for(p):
    """Deck order: a CHARACTER's squad straight after it, a transport's passengers straight
    after the transport, identical plain units folded."""
    units = p['units']
    lead = {int(k): int(v) for k, v in (p['leaderMap'] or {}).items()}
    led_by = {v: k for k, v in lead.items()}
    carry = transports(p)
    aboard = {s: ti for ti, ss in carry.items() for s in ss}
    rows, placed, groups = [], set(), {}

    def place_single(i, kind=None, ref=None):
        row = {'slots': [i], 'unit': units[i], 'kind': kind, 'ref': ref}
        rows.append(row)
        placed.add(i)
        if i in lead:
            s = lead[i]
            rows.append({'slots': [s], 'unit': units[s], 'kind': 'joined', 'ref': units[i]['name']})
            placed.add(s)
        if i in carry:
            for s in carry[i]:
                if s in placed:
                    continue
                if s in led_by:  # a joined pair aboard: its CHARACTER, then the squad
                    place_single(led_by[s], 'aboard', units[i]['name'])
                else:
                    rows.append({'slots': [s], 'unit': units[s], 'kind': 'aboard', 'ref': units[i]['name']})
                    placed.add(s)

    for i, u in enumerate(units):
        if i in placed or i in led_by or i in aboard:
            continue
        if i in lead or i == p['marshalIndex'] or u['character'] or i in carry:
            place_single(i)
            continue
        gear = u['gear']['name'] if u['gear'] else None
        key = (u['id'], gear)
        if key in groups:
            groups[key]['slots'].append(i)
        else:
            groups[key] = {'slots': [i], 'unit': u, 'kind': None, 'ref': None}
            rows.append(groups[key])
        placed.add(i)
    assert len(placed) == len(units), (p['id'], len(placed), len(units))
    return rows


def cargo_line(p, ti):
    chk = next(c for c in p['transportChecks'] if int(c['transport']) == ti)
    names = [p['units'][s]['name'] for s in transports(p)[ti]]
    return '%s carries %s (%d of %d models)' % (p['units'][ti]['name'], ', '.join(names), chk['load'], chk['capacity'])


def row_html(r, p):
    u = r['unit']
    q = len(r['slots'])
    gear_rp = u['gear']['rp'] if u['gear'] else 0
    each = u['rp'] + gear_rp
    total = q * each
    notes = []
    if p['marshalIndex'] in r['slots']:
        notes.append('<span class="tag marshal">Marshal</span>')
    if r['kind'] == 'joined':
        notes.append('<span class="sub">led by %s</span>' % e(r['ref']))
    if r['kind'] == 'aboard':
        notes.append('<span class="tag aboard">Aboard</span> <span class="sub">starts embarked in the %s</span>' % e(r['ref']))
    cls = {'joined': 'joined', 'aboard': 'aboard'}.get(r['kind'], '')
    if r['slots'][0] in transports(p):
        ti = r['slots'][0]
        chk = next(c for c in p['transportChecks'] if int(c['transport']) == ti)
        notes.append('<span class="tag carry">Transport &middot; %d/%d models aboard</span>' % (chk['load'], chk['capacity']))
        cls = 'carrier'
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
    return (
        '<tr%s><td class="unit"><span class="uname">%s</span>%s</td>'
        '<td class="tier"><span class="chip %s">%s</span></td>'
        '<td class="rp"><span class="num">%d</span>%s</td></tr>'
    ) % ((' class="%s"' % cls) if cls else '', name, ('<span class="notes">' + ' '.join(notes) + '</span>') if notes else '',
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


def tags(p):
    out = ''
    if p['id'] in NEW:
        out += ' <span class="tag new">New</span>'
    elif changes(p):
        out += ' <span class="tag changed">Changed</span>'
    return out


for p in presets:
    assert not p['errors'], (p['id'], p['errors'])
    for c in p['transportChecks']:
        assert c['load'] <= c['capacity'] and not c['cannotEmbark'], (p['id'], c)

by_faction = {}
for p in presets:
    by_faction.setdefault(p['factionName'], []).append(p)
factions = sorted(by_faction, key=lambda f: f.replace('Ā', 'A'))

summary_rows, sections = [], []
for f in factions:
    summary_rows.append('<tr class="fhead"><th colspan="3" scope="rowgroup">%s</th></tr>' % e(f))
    cards = []
    for p in sorted(by_faction[f], key=lambda x: x['name']):
        rows = rows_for(p)
        total = sum(len(r['slots']) * (r['unit']['rp'] + (r['unit']['gear']['rp'] if r['unit']['gear'] else 0)) for r in rows)
        assert total == p['rp'], (p['id'], total, p['rp'])
        marshal = p['units'][p['marshalIndex']]['name'] if p['marshalIndex'] is not None else 'none'
        sub = p['subfaction'] or 'No subfaction'
        cargo = ''.join('<span class="cargo">%s</span>' % e(cargo_line(p, ti)) for ti in transports(p))
        summary_rows.append(
            '<tr><td><a href="#%s">%s</a>%s%s%s</td>'
            '<td class="num-c">%d</td><td class="rp-c"><span class="num">%d</span>%s</td></tr>'
            % (p['id'], e(p['name']), tags(p), ('<span class="sub">%s</span>' % e(p['subfaction'])) if p['subfaction'] else '',
               cargo, len(p['units']), p['rp'], bar(p['rp'])))
        ch = changes(p)
        extra = ''
        if ch:
            extra += '<p class="changes">Changed since 27 October: %s</p>' % ', '.join(ch)
        if p['id'] in NAMED_FOR:
            extra += '<p class="card-names"><b>Named for</b>: %s</p>' % NAMED_FOR[p['id']]
        cards.append(
            '<section class="army" id="%s" aria-labelledby="%s-h">'
            '<header><div class="head-l"><h3 id="%s-h">%s</h3>'
            '<dl class="meta"><div><dt>Subfaction</dt><dd>%s</dd></div>'
            '<div><dt>Marshal</dt><dd>%s</dd></div></dl>%s</div>'
            '<div class="head-r"><span class="big num">%d</span><span class="of">/ %d RP</span>%s<span class="cnt">%d units</span></div></header>'
            '<div class="tbl"><table><thead><tr><th scope="col">Unit</th><th scope="col">Tier</th><th scope="col" class="rp">RP</th></tr></thead>'
            '<tbody>%s</tbody><tfoot><tr><td colspan="2">Total</td><td class="rp"><span class="num">%d</span></td></tr></tfoot></table></div>%s</section>'
            % (p['id'], p['id'], p['id'], e(p['name']) + tags(p), e(sub), e(marshal), cargo, p['rp'], MAX_RP, bar(p['rp']),
               len(p['units']), ''.join(row_html(r, p) for r in rows), p['rp'], extra))
    sections.append('<section class="faction"><h2>%s</h2>%s</section>' % (e(f), ''.join(cards)))

page = open(os.path.join(S, 'presets_template5.html')).read()
page = page.replace('{{SUMMARY}}', ''.join(summary_rows)).replace('{{SECTIONS}}', ''.join(sections))
page = page.replace('{{COUNT}}', str(len(presets))).replace('{{OVER}}', str(len(presets) - 40))
page = page.replace('{{REMOVED}}', ('; %s was folded into Martyrs&rsquo; Legion' % e(', '.join(REMOVED))) if REMOVED else '')
page = page.replace('{{MINRP}}', str(min(p['rp'] for p in presets))).replace('{{MAXRP}}', str(max(p['rp'] for p in presets)))
assert '{{' not in page
open(os.path.join(S, 'preset-armies5.html'), 'w').write(page)
print('ok', len(page), 'presets', len(presets), 'new', len(NEW), 'changed', sum(1 for p in presets if changes(p)), 'removed', REMOVED)
