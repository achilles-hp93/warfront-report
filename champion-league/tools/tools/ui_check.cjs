// UI check (CLAUDE.md "UI Verification"): the served warfront-fantasy.html in Chromium
// (Playwright), a skirmish against the AI, the page painting while the AI thinks.
// usage: node ui_check.cjs <repo> <shotsDir> [thread=worker]
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const repo = process.argv[2];
const shots = process.argv[3];
const thread = process.argv[4] || 'worker';
const { startOutputServer } = require(path.join(repo, 'scripts/browser_qa/common_cdp.cjs'));
const { chooseSkirmishAndMap, rollOff, pickFormations, acknowledgeDice } = require(path.join(repo, 'scripts/battle_report/skirmish_driver.cjs'));
fs.mkdirSync(shots, { recursive: true });

(async () => {
  const server = await startOutputServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const pw = await context.newPage();
  const consoleErrors = [];
  pw.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.type() + ': ' + m.text()); });
  pw.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  const requests = [];
  pw.on('request', r => requests.push(r.url()));
  // skirmish_driver speaks the CDP harness's page API: eval and waitFor.
  const page = {
    eval: expr => pw.evaluate(expr),
    waitFor: (expr, timeout) => pw.waitForFunction(expr, null, { timeout, polling: 200 }),
  };
  const url = server.baseUrl + '/warfront-fantasy.html' + (thread === 'main' ? '?ai-thread=main' : '');
  try {
    await pw.goto(url, { waitUntil: 'load', timeout: 120000 });
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 120000);
    const boot = await pw.evaluate(() => ({ title: document.title, canvas: !!document.querySelector('canvas'),
      weaponPicker: !!document.getElementById('weapon-picker'), workerBlock: (document.getElementById('ai-worker-engine') || {}).textContent.length,
      thread: aiDecisionThread() }));
    console.log('boot', JSON.stringify(boot));
    // A real-speed game: the AI's own thinking and action pauses, no seed.
    await chooseSkirmishAndMap(page, 'ACROPOLIS');
    const order = await rollOff(page);
    await pickFormations(page, order, [{ faction: 'iron_imperium', formation: 'preset:legatus_legion' },
      { faction: 'british_liberation_front', formation: 'preset:merlin_army' }]);
    await page.waitFor(`G.phase === 'BATTLE'`, 300000);
    // Player A goes back to a human: a skirmish against the AI.
    for (let i = 0; i < 600; i++) {
      await acknowledgeDice(page);
      const ok = await pw.evaluate(() => { if (G.aiActing) return false; toggleAIControl(0); return !AI.controls(0) && AI.controls(1); });
      if (ok) break;
      await pw.waitForTimeout(100);
    }
    console.log('seats', JSON.stringify(await pw.evaluate(() => ({ vsAI: G.vsAI, aiVsAi: G.aiVsAi, a: AI.controls(0), b: AI.controls(1) }))));
    // Count frames painted while the AI thinks; take a picture of the indicator.
    await pw.evaluate(() => {
      const P = window.__ui = { thinkingFrames: 0, thinkingMs: 0, gaps: [], last: null, thinks: 0, wasThinking: false };
      const loop = t => {
        const thinking = !!document.querySelector('#status-msg.ai-thinking');
        if (thinking && P.last != null && P.wasThinking) { P.thinkingFrames++; P.thinkingMs += t - P.last; P.gaps.push(t - P.last); }
        if (thinking && !P.wasThinking) P.thinks++;
        P.wasThinking = thinking; P.last = t;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    let shot = 0;
    const until = Date.now() + 150000;
    while (Date.now() < until) {
      await acknowledgeDice(page);
      const s = await pw.evaluate(() => ({ round: G.round, phase: G.battlePhase, active: G.activePlayer, acting: !!G.aiActing,
        thinking: !!document.querySelector('#status-msg.ai-thinking'), pending: !!G.pendingInterjection,
        status: (document.getElementById('status-msg') || {}).textContent }));
      if (s.thinking && shot < 3) {
        await pw.screenshot({ path: path.join(shots, `thinking-${++shot}.png`) });
        const bar = await pw.$('#bottom-bar');
        if (bar) await bar.screenshot({ path: path.join(shots, `thinking-bar-${shot}.png`) });
        console.log('thinking:', JSON.stringify(s));
      }
      // The human passes: an open interjection takes its first answer, the Cleanup Phase END PHASE.
      if (s.active === 0 && !s.acting) {
        await pw.evaluate(() => {
          if (G.pendingInterjection) { const b = document.querySelector('#interjection-prompt button, .interjection-option'); if (b) b.click(); return; }
          const id = G.battlePhase === 'CLEANUP' ? 'btn-end-phase' : 'btn-end-action';
          const b = document.getElementById(id);
          if (b && b.offsetParent) b.click();
        });
      } else if (s.phase === 'CLEANUP' && !s.acting) {
        await pw.evaluate(() => { const b = document.getElementById('btn-end-phase'); if (b && !G.aiActing) b.click(); });
      }
      if (s.round >= 3) break;
      await pw.waitForTimeout(250);
    }
    const ui = await pw.evaluate(() => {
      const P = window.__ui; const g = P.gaps.slice().sort((a, b) => a - b);
      return { thinks: P.thinks, thinkingFrames: P.thinkingFrames, thinkingMs: Math.round(P.thinkingMs),
        fps: P.thinkingMs ? +(1000 * P.thinkingFrames / P.thinkingMs).toFixed(1) : null,
        maxGap: Math.round(g[g.length - 1] || 0), p95Gap: Math.round(g[Math.floor(g.length * 0.95)] || 0),
        stats: aiDecisionWorkerStats, round: G.round };
    });
    await pw.screenshot({ path: path.join(shots, 'final.png') });
    console.log('ui', JSON.stringify(ui));
    console.log('served', requests.filter(u => /warfront-fantasy\.html/.test(u)).slice(0, 2));
    console.log('console errors/warnings', consoleErrors.length, JSON.stringify(consoleErrors.slice(0, 10)));
  } finally {
    await browser.close();
    server.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
