const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [src, outPrefix] = process.argv.slice(2);
  const body = fs.readFileSync(src, 'utf8');
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}</style></head><body>' + body + '</body></html>';
  const tmp = outPrefix + '.wrapped.html'; fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  for (const [w, scheme] of [[1280, 'light'], [390, 'dark']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('file://' + tmp); await page.waitForTimeout(1500);
    const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, document.body.scrollHeight]);
    await page.screenshot({ path: `${outPrefix}-${w}-${scheme}.png` });
    console.log(w, scheme, 'scrollWidth/innerWidth/height', sw.join('/'), 'errors', errs.length ? errs.slice(0, 3) : 'none');
    await page.close();
  }
  await browser.close();
})();
