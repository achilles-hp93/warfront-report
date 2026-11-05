"""Write the preset-army comps page from presets.json (dumped from the built game)."""
import html
import json
import os

S = os.path.dirname(os.path.abspath(__file__))
presets = json.load(open(os.path.join(S, 'presets3.json')))
MAX_RP = 250
e = html.escape


# The seven new presets and their name options (first = recommended), as offered in chat.
NAME_OPTIONS = {
    'andranik_army': [
        ('Gund of Sasun', '<i>Gund</i> is the game&rsquo;s word for an Armenian regimental division; Sasun is the mountain district behind Andranik&rsquo;s Sasun Shortsword.'),
        ('Nakharar Levy', 'The noble houses whose levies muster for Andranik in the faction lore.'),
        ('Vigil of Masis', 'Masis is the Armenian name for Ararat, and VIGIL is this army&rsquo;s own focus-fire marker. Close to the campaign army name &ldquo;Masis Gund&rdquo;.'),
    ],
    'zumalakarregi_army': [
        ('Oak of Gernika', 'The oak where the General Assembly sits and where Zumalakarregi was elected (the real Gernikako Arbola).'),
        ('Muster of the Foruak', 'The valleys&rsquo; own law, which he fought the First Foral War to keep.'),
        ('Batzarre Companies', 'The valley assemblies that raise the house companies.'),
    ],
    'vainamoinen_army': [
        ('Song of the Sampo', 'Finnic armies are &ldquo;named by the song that called it&rdquo; in the campaign data; the Sampo is the Kalevala&rsquo;s wonder-mill that the tiet&auml;j&auml;t&rsquo;s verses remember.'),
        ('Sissi Rifles', '<i>Sissi</i> were Finnish forest irregulars (there is already a &ldquo;Sissi Habits&rdquo; trait); fits riflemen who are deadliest unseen.'),
        ('V&auml;in&ouml;l&auml; Verse', 'V&auml;in&ouml;l&auml; is V&auml;in&auml;m&ouml;inen&rsquo;s home country in the Kalevala.'),
    ],
    'sirko_army': [
        ('Beyond the Rapids', 'What &ldquo;Zaporozhian&rdquo; literally means. Close to the campaign&rsquo;s &ldquo;Rapids Host&rdquo; names.'),
        ('Sich Brotherhood', 'The Sich&rsquo;s comradeship, which elected Sirko.'),
        ('Bulava of the Rada', 'The ataman&rsquo;s mace, which the Rada gave Sirko eight times in the lore.'),
    ],
    'five_banner_army': [
        ('Shence Army', 'The &ldquo;Divine Strategy&rdquo; Army, a Tang frontier army that became the palace army.'),
        ('Anxi Protectorate', 'The Protectorate General to Pacify the West, Tang&rsquo;s western frontier command.'),
        ('Longwu Army', 'The &ldquo;Dragon Martial&rdquo; Army, one of the Tang Northern Armies guarding the capital.'),
    ],
    'gilgamesh_army': [
        ('Walls of Uruk', 'Gilgamesh built them, and the Epic opens and closes on them; suits the fortified posture.'),
        ('Fifty of Uruk', 'The fifty young men of Uruk he took to the Cedar Forest in the Sumerian <i>Gilgamesh and Huwawa</i>.'),
        ('Eanna Cohort', 'Eanna is Ishtar&rsquo;s temple precinct in Uruk, and &ldquo;Cohort&rdquo; is how Akkadian armies are named in the campaign.'),
    ],
    'kosciuszko_army': [
        ('Oath of Krak&oacute;w', 'Ko&#347;ciuszko&rsquo;s oath on Krak&oacute;w&rsquo;s market square in March 1794, which opened the rising (it happened in the setting too).'),
        ('Rac&#322;awice Scythes', 'His first victory of that rising, won when peasant scythemen took the enemy guns; ties to his &ldquo;Upright Scythe&rdquo; trait.'),
        ('Common Standards', 'The banners the three realms fought under and carried to his sickbed in the lore. Close to the campaign&rsquo;s &ldquo;Army of the Three Standards&rdquo;.'),
    ],
}
NEW = set(NAME_OPTIONS)
PENDING = ' (name pending)'


def display_name(p):
    return p['name'][:-len(PENDING)] if p['name'].endswith(PENDING) else p['name']


def name_tags(p):
    out = ''
    if p['id'] in NEW:
        out += ' <span class="tag new">New</span>'
    if p['name'].endswith(PENDING):
        out += ' <span class="tag pending">Name pending</span>'
    return out


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


def card_names(p):
    opts = NAME_OPTIONS.get(p['id'])
    if not opts:
        return ''
    return ('<p class="card-names">Name options: %s. <a href="#names-%s">Sources</a></p>'
            % (', '.join(('<b>%s</b>' if i == 0 else '%s') % n for i, (n, _) in enumerate(opts)), p['id']))


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
    summary_rows.append('<tr class="fhead"><th colspan="3" scope="rowgroup">%s</th></tr>' % e(f))
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
            '<tr><td><a href="#%s">%s</a>%s%s</td>'
            '<td class="num-c">%d</td><td class="rp-c"><span class="num">%d</span>%s</td></tr>'
            % (p['id'], e(display_name(p)), name_tags(p), ('<span class="sub">%s</span>' % e(p['subfaction'])) if p['subfaction'] else '', len(p['units']), p['rp'], bar(p['rp'])))
        cards.append(
            '<section class="army" id="%s" aria-labelledby="%s-h">'
            '<header><div class="head-l"><h3 id="%s-h">%s</h3>'
            '<dl class="meta"><div><dt>Subfaction</dt><dd>%s</dd></div>'
            '<div><dt>Marshal</dt><dd>%s</dd></div></dl></div>'
            '<div class="head-r"><span class="big num">%d</span><span class="of">/ %d RP</span>%s<span class="cnt">%d units</span></div></header>'
            '<div class="tbl"><table><thead><tr><th scope="col">Unit</th><th scope="col">Tier</th><th scope="col" class="rp">RP</th></tr></thead>'
            '<tbody>%s</tbody><tfoot><tr><td colspan="2">Total</td><td class="rp"><span class="num">%d</span></td></tr></tfoot></table></div>%s</section>'
            % (p['id'], p['id'], p['id'], e(display_name(p)) + name_tags(p), e(sub), e(marshal), p['rp'], MAX_RP, bar(p['rp']),
               len(p['units']), ''.join(row_html(r, p) for r in rows), p['rp'],
               (('<p class="removed">Removed since the last version: %s</p>' % removed) if removed else '') + card_names(p)))
    sections.append('<section class="faction"><h2>%s</h2>%s</section>' % (e(f), ''.join(cards)))

page = open(os.path.join(S, 'presets_template3.html')).read()
page = page.replace('{{SUMMARY}}', ''.join(summary_rows)).replace('{{SECTIONS}}', ''.join(sections))
picks = []
for f in factions:
    for p in by_faction[f]:
        if p['id'] not in NAME_OPTIONS:
            continue
        items = ''.join('<li%s><span class="opt">%s</span><span class="why">%s</span></li>' % (' class="rec"' if i == 0 else '', n, why)
                        for i, (n, why) in enumerate(NAME_OPTIONS[p['id']]))
        picks.append('<article class="pick" id="names-%s"><div class="pick-head"><h3>%s</h3><a href="#%s">%d units, %d RP</a></div><ol>%s</ol></article>'
                     % (p['id'], e(f), p['id'], len(p['units']), p['rp'], items))
assert len(picks) == len(NAME_OPTIONS), len(picks)
page = page.replace('{{NAMES}}', ''.join(picks))
page = page.replace('{{COUNT}}', str(len(presets)))
page = page.replace('{{MINRP}}', str(min(p['rp'] for p in presets))).replace('{{MAXRP}}', str(max(p['rp'] for p in presets)))
open(os.path.join(S, 'preset-armies3.html'), 'w').write(page)
print('ok', len(page))
