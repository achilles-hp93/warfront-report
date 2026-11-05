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
  await pg.goto(`http://127.0.0.1:${port}/warfront-fantasy.html`, { waitUntil: 'load', timeout: 180000 });
  await pg.waitForTimeout(4000);
  const out = await pg.evaluate(async () => {
    aiWarmDecisionWorker();
    await new Promise(r => setTimeout(r, 3000));
    return { title: document.title, canvas: !!document.querySelector('canvas'), picker: !!document.getElementById('weapon-picker'),
      thread: aiDecisionThread(), usable: _aiDecisionWorkerUsable(), failed: _aiWorkerFailed,
      envyBanner: _fpIdentityBanner('addon', Factions.subfaction('cult_of_unbridled_enmity').addonIdentity).indexOf('undefined') < 0 };
  });
  console.log(JSON.stringify(out)); console.log('console errors:', errors.slice(0, 5));
  await b.close(); srv.close();
});
