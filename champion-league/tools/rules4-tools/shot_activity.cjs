'use strict';
// Screenshot a report page's #activity section through the repo's CDP harness.
// WARFRONT_OUTPUT_DIR=<dir holding the page> node shot_activity.cjs <page file name> <out prefix>
const path = require('path');
const qa = require('/home/user/warfront/.claude/worktrees/agent-a40f030ca73460094/scripts/browser_qa/common_cdp.cjs');
(async () => {
  const [file, outPrefix] = process.argv.slice(2);
  const server = await qa.startOutputServer();
  const chrome = await qa.startChrome();
  const harness = new qa.BrowserQaHarness(server.baseUrl, chrome.browserWsUrl || chrome.wsUrl);
  try {
    if (harness.connect) await harness.connect();
    for (const [w, scheme] of [[1280, 'light'], [390, 'dark']]) {
      const page = await harness.newPage('/' + file, 'report');
      await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: 1400, deviceScaleFactor: 1, mobile: w < 500 });
      await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
      await qa.sleep(800);
      const info = await page.eval(`(() => { const s = document.getElementById('activity'); if (s) s.scrollIntoView();
        return JSON.stringify({ scrollWidth: document.documentElement.scrollWidth, inner: window.innerWidth,
          advanceChart: !!document.getElementById('rank-advance-only'), advanceRows: s ? (s.textContent.match(/Advanced, nothing else/g) || []).length : 0 }); })()`);
      await qa.sleep(400);
      const rect = JSON.parse(await page.eval(`JSON.stringify((() => { const r = document.getElementById('activity').getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }; })())`));
      const shot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: Object.assign({ scale: 1 }, rect) });
      require('fs').writeFileSync(`${outPrefix}-${w}-${scheme}.png`, Buffer.from(shot.data, 'base64'));
      console.log(w, scheme, info);
      await page.close();
    }
  } finally {
    if (harness.close) await harness.close();
    await chrome.stop();
    server.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
