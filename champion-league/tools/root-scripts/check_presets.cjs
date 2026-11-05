// node check_presets.cjs <output dir> <candidates.json>: each candidate preset read as the
// picker reads it (_armoryReadSavedArmy) plus armyLegality (RP, unit cap, tier limits).
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const root = process.argv[2];
const cands = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200); res.end(d); });
}).listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch(); const pg = await b.newPage();
  const errors = []; pg.on('pageerror', e => errors.push(String(e)));
  await pg.goto(`http://127.0.0.1:${port}/warfront-fantasy.html`, { waitUntil: 'load', timeout: 120000 });
  await pg.waitForTimeout(2000);
  const out = await pg.evaluate((cands) => {
    const r = { limits: {}, presets: [] };
    ['STANDARD', 'SPECIALIST', 'ELITE', 'EPIC', 'EPIC HERO'].forEach(t => { r.limits[t] = tierCopyLimit(t); });
    r.maxUnits = ARMY_RULES.maxUnits;
    const all = cands.concat(PRESET_ARMIES_DATA.filter(e => !cands.some(c => c.id === e.id)).map(e => Object.assign({ existing: true }, e)));
    all.forEach(e => {
      const fac = e.faction || e.factionId;
      const read = _armoryReadSavedArmy(e, fac);
      const leg = armyLegality(read.templates.filter(Boolean), 0, Factions.tierLimits(e.subfactionId || null));
      const chars = read.templates.filter(t => t && _formationIsCharacter(t)).length;
      r.presets.push({ id: e.id, existing: !!e.existing, faction: fac, sub: e.subfactionId || null, rp: leg.rp, units: read.templates.length, chars: chars,
        problems: read.problems.concat(leg.errors.map(x => x.message)) });
    });
    return r;
  }, cands);
  console.log(JSON.stringify(out.limits), 'maxUnits', out.maxUnits);
  out.presets.forEach(p => console.log((p.existing ? '  ' : '* ') + p.id.padEnd(28), (p.sub || '-').padEnd(30), 'rp=' + p.rp, 'units=' + p.units, 'chars=' + p.chars, p.problems.length ? 'PROBLEMS: ' + p.problems.join(' | ') : 'ok'));
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await b.close(); srv.close();
});
