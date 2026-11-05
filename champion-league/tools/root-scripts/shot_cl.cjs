const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const html = require('fs').readFileSync(process.argv[2], 'utf8');
  for (const [w, name, scheme] of [[1100, 'desk', 'light'], [390, 'phone', 'dark']]) {
    const pg = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>');
    await pg.waitForTimeout(1200);
    if (name === 'phone') await pg.click('#place-5');
    const sw = await pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    await pg.screenshot({ path: process.argv[3] + '-' + name + '.png', fullPage: true });
    console.log(name, sw, errs);
  }
  await b.close();
})();
