const { chromium } = require('playwright');
(async () => {
  const fs = require('fs');
  const body = fs.readFileSync(process.argv[2], 'utf8');
  const doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}</style></head><body>' + body + '</body></html>';
  const b = await chromium.launch();
  for (const [w, scheme, name] of [[1100, 'light', 'desk-light'], [390, 'dark', 'phone-dark']]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    await p.setContent(doc, { waitUntil: 'networkidle' }).catch(() => {});
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log(name, 'scrollWidth', sw);
    await p.screenshot({ path: name + '.png', fullPage: false });
    await p.evaluate(() => document.getElementById('high_admiral_army').scrollIntoView());
    await p.screenshot({ path: name + '-admiral.png' });
  }
  await b.close();
})();
