const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const html = require('fs').readFileSync(process.argv[2], 'utf8');
  for (const [w, name, scheme] of [[1200, 'desk', 'light'], [390, 'phone', 'dark']]) {
    const pg = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    await pg.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>');
    await pg.waitForTimeout(800);
    const sw = await pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    await pg.locator('.intro').screenshot({ path: process.argv[3] + '-' + name + '-intro.png' });
    await pg.locator('.names').screenshot({ path: process.argv[3] + '-' + name + '-names.png' });
    await pg.locator('.callout').screenshot({ path: process.argv[3] + '-' + name + '-cl.png' });
    await pg.locator('#andranik_army').screenshot({ path: process.argv[3] + '-' + name + '-hayk.png' });
    console.log(name, 'scrollWidth/clientWidth', sw);
  }
  await b.close();
})();
