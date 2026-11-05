const { chromium } = require('playwright');
(async () => {
  const [file, prefix] = process.argv.slice(2);
  const browser = await chromium.launch();
  const out = [];
  for (const [w, scheme] of [[390, 'light'], [1000, 'dark']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto('file://' + file);
    await page.waitForTimeout(400);
    out.push({ w, scheme, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth), errs });
    await page.screenshot({ path: `${prefix}-${w}-${scheme}.png`, fullPage: true });
    await page.close();
  }
  console.log(JSON.stringify(out));
  await browser.close();
})();
