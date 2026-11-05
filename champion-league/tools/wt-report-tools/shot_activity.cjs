// shot_activity.cjs <battle_report.html> <out prefix> - the activity section, light at 1280 px
// and dark at 390 px: a screenshot of each, the page's horizontal scroll and its errors.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const [src, outPrefix] = process.argv.slice(2);
  const body = fs.readFileSync(src, 'utf8');
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + body + '</body></html>';
  const tmp = outPrefix + '.wrapped.html';
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  for (const [w, scheme] of [[1280, 'light'], [390, 'dark']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('file://' + tmp);
    await page.waitForTimeout(1000);
    const info = await page.evaluate(() => {
      const seg = document.querySelector('#activity .seg.act-hold');
      const key = Array.from(document.querySelectorAll('#activity .legend li')).map(li => li.textContent.trim());
      const cs = seg ? getComputedStyle(seg) : null;
      return { scroll: [document.documentElement.scrollWidth, window.innerWidth], holdSegments: document.querySelectorAll('#activity .seg.act-hold').length,
        bg: cs && cs.backgroundColor, ink: cs && cs.color, legend: key };
    });
    const el = await page.$('#activity');
    if (el) await el.screenshot({ path: `${outPrefix}-${w}-${scheme}.png` });
    console.log(w, scheme, JSON.stringify(info), 'errors', errs.length ? errs.slice(0, 3) : 'none');
    await page.close();
  }
  await browser.close();
})();
