const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const root = process.argv[2];
const srv = http.createServer((req, res) => { fs.readFile(path.join(root, decodeURIComponent(req.url.split('?')[0])), (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200); res.end(d); }); }).listen(0, async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto(`http://127.0.0.1:${srv.address().port}/warfront-fantasy.html`, { waitUntil: 'load', timeout: 120000 }); await pg.waitForTimeout(2000);
  const out = await pg.evaluate(() => {
    const two = { id: 'p', name: 'p', faction: 'iron_imperium', doctrineId: 'none', subfactionId: 'officia_caesaris', units: ['palatine_protospatharius', 'palatine_custos', 'palatine_custos', 'praetorian_strikers'], leaderMap: { 0: 1 }, marshalIndex: 0 };
    const plain = Object.assign({}, two, { subfactionId: null, units: ['legatus', 'palatine_custos', 'palatine_custos'], leaderMap: {} });
    return { officia: _savedArmyErrors(two, 'iron_imperium').map(e => e.message), plain: _savedArmyErrors(plain, 'iron_imperium').map(e => e.message),
      doctrines: PRESET_ARMIES_DATA.map(p => _getFormationDoctrineLabel(p, p.faction)).filter(l => l !== 'No doctrine'),
      };
  });
  console.log(JSON.stringify(out)); await b.close(); srv.close();
});
