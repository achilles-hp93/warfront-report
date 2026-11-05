const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2];
  const browser = await chromium.launch();
  const out = [];
  for (const [w, scheme] of [[390, 'light'], [390, 'dark'], [1100, 'light']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto('file://' + S + '/preset-armies5.html');
    await page.waitForTimeout(500);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    for (const id of ['celeritas_squadron', 'pontifex_procession']) {
      const el = await page.$('#' + id);
      await el.screenshot({ path: `${S}/shot-${id}-${w}-${scheme}.png` });
    }
    out.push({ w, scheme, scrollWidth: sw, errs });
    await page.close();
  }
  console.log(JSON.stringify(out));
  await browser.close();
})();
