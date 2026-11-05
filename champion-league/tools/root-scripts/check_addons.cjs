const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const root = process.argv[2];
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200); res.end(d); });
}).listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch(); const pg = await b.newPage();
  const errors = []; pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); pg.on('pageerror', e => errors.push(String(e)));
  await pg.goto(`http://127.0.0.1:${port}/warfront-fantasy.html`, { waitUntil: 'load', timeout: 120000 });
  await pg.waitForTimeout(3000);
  const out = await pg.evaluate(() => {
    const r = { title: document.title, canvas: !!document.querySelector('canvas'), picker: !!document.getElementById('weapon-picker') };
    const sub = Factions.subfaction('cult_of_unbridled_enmity');
    const html = _fpIdentityBanner('addon', sub.addonIdentity);
    r.bannerHasUndefined = html.indexOf('undefined') >= 0;
    r.bannerText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);
    r.presets = PRESET_ARMIES_DATA.filter(e => e.subfactionId).map(e => ({ id: e.id, problems: _armoryReadSavedArmy(e, e.faction).problems }));
    r.lustPool = Factions.units('infernal_congregations', 'cult_of_tempestuous_rapture').map(k => k.split(':').pop());
    r.envyPoolChars = Factions.units('infernal_congregations', 'cult_of_unbridled_enmity').filter(k => (UNITS_DATA[k].tags||[]).indexOf('CHARACTER') >= 0).map(k => k.split(':').pop());
    return r;
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('console errors:', errors.slice(0, 5));
  await b.close(); srv.close();
});
