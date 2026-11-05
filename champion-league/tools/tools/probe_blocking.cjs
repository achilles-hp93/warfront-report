// Main-thread blocking during an AI-vs-AI battle, page thread vs worker.
// usage: node probe_blocking.cjs <repo> <main|worker> <seed> [a] [b] [maxRound]
const path = require('path');
const repo = process.argv[2];
const thread = process.argv[3] || 'worker';
const seed = Number(process.argv[4] || 1);
const sideA = process.argv[5] || 'iron_imperium/preset:legatus_legion';
const sideB = process.argv[6] || 'british_liberation_front/preset:merlin_army';
const maxRound = Number(process.argv[7] || 99);
const { startOutputServer, startChrome, BrowserQaHarness } = require(path.join(repo, 'scripts/browser_qa/common_cdp.cjs'));
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle, acknowledgeDice } = require(path.join(repo, 'scripts/battle_report/skirmish_driver.cjs'));
const side = s => ({ faction: s.slice(0, s.indexOf('/')), formation: s.slice(s.indexOf('/') + 1) });

const PROBE = `(() => {
  const P = window.__probe = { gaps: [], longTasks: [], frames: 0, last: performance.now(), decisions: [], split: { request: 0, post: 0, apply: 0, n: 0 } };
  const loop = (t) => {
    const gap = t - P.last; P.gaps.push([gap, !!G.aiActing, G.phase === 'BATTLE', P.last, t]); P.last = t; P.frames++;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  // Each turn's decision, from the moment it is asked until its action comes back.
  if (typeof aiDecide === 'function') {
    const realDecide = aiDecide;
    aiDecide = function(player, done) {
      const rec = { t0: performance.now(), t1: null };
      P.decisions.push(rec);
      return realDecide.call(this, player, function(action) { rec.t1 = performance.now(); return done(action); });
    };
    const realReq = aiDecisionRequest;
    aiDecisionRequest = function() { const t = performance.now(); try { return realReq.apply(this, arguments); } finally { P.split.request += performance.now() - t; P.split.n++; } };
    const realPost = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function() { const t = performance.now(); try { return realPost.apply(this, arguments); } finally { P.split.post += performance.now() - t; } };
    const realApply = aiApplyDecisionAnswer;
    aiApplyDecisionAnswer = function() { const t = performance.now(); try { return realApply.apply(this, arguments); } finally { P.split.apply += performance.now() - t; } };
  } else {
    const realChoose = aiChooseAction;
    aiChooseAction = function() { const rec = { t0: performance.now(), t1: null }; P.decisions.push(rec); try { return realChoose.apply(this, arguments); } finally { rec.t1 = performance.now(); } };
  }
  const realVictory = showVictory; showVictory = function() { window.__over = true; return realVictory.apply(this, arguments); };
  new PerformanceObserver(list => list.getEntries().forEach(e => P.longTasks.push([e.duration, !!G.aiActing, G.phase === 'BATTLE', e.startTime]))).observe({ entryTypes: ['longtask'] });
  return true;
})()`;

const SUMMARY = `(() => {
  const P = window.__probe;
  const q = (arr, p) => { if (!arr.length) return 0; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const inBattle = P.gaps.filter(g => g[2]);
  const ai = inBattle.filter(g => g[1]).map(g => g[0]);
  const all = inBattle.map(g => g[0]);
  const lt = P.longTasks.filter(t => t[2]);
  const ltAi = lt.filter(t => t[1]).map(t => t[0]);
  return {
    frames: inBattle.length, framesAiThinking: ai.length,
    gapMaxAll: Math.round(Math.max(0, ...all)), gapP99All: Math.round(q(all, 0.99)),
    gapMaxAi: Math.round(Math.max(0, ...ai)), gapP99Ai: Math.round(q(ai, 0.99)), gapP95Ai: Math.round(q(ai, 0.95)),
    gapsOver100Ai: ai.filter(g => g > 100).length, gapsOver250Ai: ai.filter(g => g > 250).length,
    longTasks: lt.length, longTaskMax: Math.round(Math.max(0, ...lt.map(t => t[0]))), longTaskSum: Math.round(lt.reduce((a, t) => a + t[0], 0)),
    longTasksAi: ltAi.length, longTaskMaxAi: Math.round(Math.max(0, ...ltAi)), longTaskSumAi: Math.round(ltAi.reduce((a, b) => a + b, 0)),
    stats: typeof aiDecisionWorkerStats !== 'undefined' ? aiDecisionWorkerStats : null,
    // While the AI decides: the decisions' own spans.
    thinking: (() => {
      const spans = P.decisions.filter(d => d.t1 != null);
      const inside = (a, b) => spans.some(d => a < d.t1 && b > d.t0);
      const lts = P.longTasks.filter(t => inside(t[3], t[3] + t[0]));
      const gs = P.gaps.filter(g => inside(g[3], g[4])).map(g => g[0]);
      const total = spans.reduce((s, d) => s + d.t1 - d.t0, 0);
      const ds = spans.map(d => d.t1 - d.t0).sort((a, b) => a - b);
      const within = P.longTasks.filter(t => spans.some(d => t[3] >= d.t0 && t[3] + t[0] <= d.t1));
      const gapRows = P.gaps.filter(g => inside(g[3], g[4]));
      const worst = gapRows.slice().sort((a, b) => b[0] - a[0]).slice(0, 3).map(g => ({ gap: Math.round(g[0]), at: Math.round(g[3]),
        decision: spans.findIndex(d => g[3] < d.t1 && g[4] > d.t0), firstDecisionAt: Math.round(spans[0] ? spans[0].t0 : 0) }));
      const tasksFullyInside = { n: within.length, longest: Math.round(Math.max(0, ...within.map(t => t[0]))), ms: Math.round(within.reduce((a, t) => a + t[0], 0)) };
      return { tasksFullyInside, worstGaps: worst, decisions: spans.length, decisionMsTotal: Math.round(total), decisionMsMax: Math.round(ds[ds.length - 1] || 0),
        decisionMsP50: Math.round(ds[Math.floor(ds.length / 2)] || 0),
        framesPainted: gs.length, fpsWhileThinking: total ? +(1000 * gs.length / total).toFixed(1) : null,
        longestFrameGap: Math.round(Math.max(0, ...gs)), frameGapsOver100: gs.filter(g => g > 100).length,
        longTasks: lts.length, longestTask: Math.round(Math.max(0, ...lts.map(t => t[0]))), longTaskMsTotal: Math.round(lts.reduce((a, t) => a + t[0], 0)) };
    })(),
    split: P.split,
    result: { round: G.round, vp: (G.players || []).map(p => p.vp) },
  };
})()`;

(async () => {
  const server = await startOutputServer();
  const chrome = await startChrome({});
  const harness = new BrowserQaHarness(server.baseUrl, chrome.browserWsUrl);
  try {
    const page = await harness.newPage('/fantasy', 'probe');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    // An older build has no AI_RANDOM: seed Math.random as its FAST did.
    const legacy = await page.eval(`typeof AI_RANDOM === 'undefined'`);
    if (legacy) {
      await page.eval(`((seed) => { let s = seed >>> 0; Math.random = function() { s = (s + 0x6D2B79F5) >>> 0; let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        const realOption = getGameOption; getGameOption = function(key) { return key === 'diceAnimation' ? false : realOption(key); };
        AI_WEIGHTS.THINKING_DELAY_MS = 0; AI_WEIGHTS.ACTION_DELAY_MS = 0; return true; })(${seed})`);
    } else {
      await page.eval(`(${FAST})(${seed})`);
    }
    await page.eval(`typeof setAiDecisionThread === "function" && setAiDecisionThread(${JSON.stringify(thread)}); true`);
    // The worker's heap, by CDP: attach to workers as they start.
    const workers = [];
    page.connection.ws.on('message', raw => {
      const msg = JSON.parse(raw);
      if (msg.method === 'Target.attachedToTarget' && msg.params.targetInfo.type === 'worker') workers.push(msg.params.sessionId);
    });
    await page.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
    await page.eval(PROBE);
    await chooseSkirmishAndMap(page, 'ACROPOLIS');
    const order = await rollOff(page);
    await pickFormations(page, order, [side(sideA), side(sideB)]);
    const heapBefore = await page.send('Runtime.getHeapUsage');
    let stopped = false;
    await Promise.race([
      playBattle(page, { log: l => console.log('  ' + l) }),
      (async () => {
        for (;;) {
          await new Promise(r => setTimeout(r, 1000));
          const r = await page.eval('window.__over ? 999 : G.round');
          if (r > maxRound) { stopped = r !== 999; return; }
        }
      })(),
    ]);
    const summary = await page.eval(SUMMARY, 120000);
    summary.thread = thread;
    summary.stoppedAtRound = stopped ? maxRound + 1 : null;
    summary.mainHeapMB = +((await page.send('Runtime.getHeapUsage')).usedSize / 1048576).toFixed(1);
    summary.mainHeapAtBattleStartMB = +(heapBefore.usedSize / 1048576).toFixed(1);
    summary.workerHeaps = [];
    for (const sid of workers) {
      try {
        const h = await page.connection.send('Runtime.getHeapUsage', {}, sid);
        summary.workerHeaps.push({ usedMB: +(h.usedSize / 1048576).toFixed(1), totalMB: +(h.totalSize / 1048576).toFixed(1) });
      } catch (e) { summary.workerHeaps.push({ error: e.message }); }
    }
    console.log(JSON.stringify(summary, null, 1));
  } finally {
    harness.close(); await chrome.stop(); server.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
