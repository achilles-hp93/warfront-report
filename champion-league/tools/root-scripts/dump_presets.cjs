// node dump_presets.cjs <output dir> <out.json>: every preset as the comps page reads it.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const root = process.argv[2];
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200); res.end(d); });
}).listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto(`http://127.0.0.1:${port}/warfront-fantasy.html`, { waitUntil: 'load', timeout: 120000 });
  await pg.waitForTimeout(2000);
  const out = await pg.evaluate(() => PRESET_ARMIES_DATA.map(e => {
    const fac = e.faction;
    const read = _armoryReadSavedArmy(e, fac);
    const gearRp = Object.keys(read.gearMap).reduce((n, k) => n + (read.gearMap[k].gearRp || 0), 0);
    const leg = armyLegality(read.templates.filter(Boolean), gearRp, Factions.tierLimits(e.subfactionId || null));
    const sub = e.subfactionId ? Factions.subfaction(e.subfactionId) : null;
    const doc = e.doctrineId ? (DOCTRINES_DATA[e.doctrineId] || Object.values(DOCTRINES_DATA).find(d => d.id === e.doctrineId)) : null;
    return { id: e.id, name: e.name, faction: fac, factionName: _getFactionName(fac), subfaction: sub ? sub.name : null,
      doctrineId: e.doctrineId || null, doctrine: doc ? doc.name : null, fielded: _getFormationDoctrineLabel(e, fac),
      marshalIndex: e.marshalIndex, leaderMap: e.leaderMap || {}, problems: read.problems, rp: leg.rp, unitsRp: leg.unitsRp,
      count: leg.cappedCount, errors: leg.errors.map(x => x.message),
      units: read.templates.map((t, i) => ({ id: t.id.split(':').pop(), name: t.name, rp: t.rp, tier: unitTier(t),
        character: _formationIsCharacter(t), tags: t.tags || [],
        gear: read.gearMap[i] ? { name: read.gearMap[i].name, rp: read.gearMap[i].gearRp || 0 } : null })) };
  }));
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  console.log('presets', out.length, out.filter(p => p.problems.length || p.errors.length).map(p => p.id));
  await b.close(); srv.close();
});
