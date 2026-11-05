// Replays one battle and, once it stops making progress for 45 s, prints what the page is
// waiting on: the phase, whose turn, the AI's flags, any open prompt, the last log lines.
// Usage: node stall_probe.cjs <faction/formation A> <faction/formation B> <seed>
const path = require('path');
const REPO = '/home/user/warfront';
const { recordBattle, startRecorder, parseSide } = require(path.join(REPO, 'scripts/battle_report/record.cjs'));

const [a, b, seed] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const DIAG = `(() => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
  const dialogs = [...document.querySelectorAll('[id*=modal],[class*=modal],[id*=prompt],[class*=prompt],[id*=overlay],[class*=overlay],[role=dialog]')]
    .filter(vis).map(el => (el.id || el.className) + ': ' + (el.innerText || '').replace(/\\s+/g, ' ').slice(0, 200)).slice(0, 12);
  const pick = {};
  ['round','phase','battlePhase','activePlayer','currentPlayer','aiActing','pendingInterjection','turnPlayer','actionPlayer','reactionPending','awaitingReaction','pendingReaction'].forEach(k => { if (k in G) pick[k] = G[k] && typeof G[k] === 'object' ? JSON.stringify(G[k]).slice(0, 300) : G[k]; });
  const ai = {};
  ['enabled','aiVsAi','player','_busy','_running','_scheduled','_thinking'].forEach(k => { if (typeof AI !== 'undefined' && k in AI) ai[k] = AI[k]; });
  const brief = v => { try { return JSON.stringify(v, (k, x) => (x && typeof x === 'object' && x.uid != null && Array.isArray(x.models)) ? ('unit:' + x.name + '#' + x.uid) : x).slice(0, 800); } catch (e) { return String(e); } };
  pick.pendingPostAttackMove = brief(G.pendingPostAttackMove);
  pick.pendingAction = brief(G.pendingAction);
  pick.pendingInterjectionQueue = brief(G.pendingInterjectionQueue);
  pick.replayTail = brief(typeof Replay !== 'undefined' && Replay._actions ? Replay._actions.slice(-3) : null);
  pick.aiLogTail = null;
  pick.acting = typeof AI !== 'undefined' ? AI._acting : null;
  pick.pendingMoveOrders = brief(G.pendingMoveOrders);
  pick.moveOrdersInPlay = typeof moveOrdersInPlay === 'function' ? moveOrdersInPlay() : 'n/a';
  pick.owedFeaturePicks = brief(G.owedFeaturePicks);
  pick.pendingRepositions = brief(G.pendingRepositions);
  pick.interjectionOpen = typeof interjectionOpen === 'function' ? interjectionOpen() : 'n/a';
  pick.activeUnit = brief(G.activeUnit || G.activatingUnit || G.selectedUnit || null);
  const db = G.units.filter(u => u.alive && u.player === 1).map(u => u.name + '#' + u.uid + ' ap=' + u.ap + ' attacked=' + !!u.attacked + ' activated=' + !!u.activated + ' done=' + !!u.activationDone);
  pick.p1units = db;
  return { G: pick, AI: ai, dialogs, log: (G.combatLog || []).slice(-30).map(l => typeof l === 'string' ? l : (l.text || l.msg || JSON.stringify(l))) };
})()`;

(async () => {
  const recorder = await startRecorder();
  const harness = recorder.harness;
  let page = null;
  const newPage = harness.newPage.bind(harness);
  const TRACE = `(() => {
    const T = window.__trace = [];
    const names = ['startMoveOrders','browserStepAfterAction','_browserStepAfterShown','afterRollPresentations','beginMoveOrders','_deferredSwitchTurn','_browserKeepTurnStep','resolveImmediateUnitPick','takeBrowserAction','executeRegisteredAction','offerInterjection','_stepMoveOrdersAI','presentMoveOrders','moveOrdersHoldTurn','phaseFlowAfterAction','kickAITurn','takeAITurn'];
    names.forEach(n => {
      const fn = window[n];
      if (typeof fn !== 'function') { T.push('missing ' + n); return; }
      window[n] = function() {
        if (G && G.round === 3 && G.battlePhase === 'ACTION') T.push('> ' + n + ' ' + (n === 'executeRegisteredAction' || n === 'takeBrowserAction' ? (arguments[0] && arguments[0].type) : '') + ' run=' + !!G.pendingMoveOrders + ' inPlay=' + (typeof moveOrdersInPlay === 'function' ? moveOrdersInPlay() : '?'));
        const r = fn.apply(this, arguments);
        if (G && G.round === 3 && G.battlePhase === 'ACTION') T.push('< ' + n + ' run=' + !!G.pendingMoveOrders);
        return r;
      };
    });
  })()`;
  harness.newPage = async (...args) => {
    page = await newPage(...args);
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(TRACE);
    return page;
  };
  let done = false;
  recordBattle(harness, {
    a: parseSide(a), b: parseSide(b), seed: Number(seed), map: 'CROSSROADS',
    noDoctrine: true, images: false, log: line => console.log('[battle]', line),
  }).then(() => { done = true; console.log('battle finished'); }, err => { done = true; console.log('battle error', err.message); });
  let last = '', since = Date.now(), dumped = 0;
  while (!done) {
    await sleep(5000);
    if (!page) continue;
    let s;
    try { s = await page.eval(`(${'() => ({ p: (window.__battleRecord ? window.__battleRecord.seq : 0) + ":" + (typeof Replay !== "undefined" && Replay._actions ? Replay._actions.length : 0) + ":" + (G.combatLog || []).length })'})()`, 10000); }
    catch (err) { console.log('eval failed', err.message); continue; }
    if (s.p !== last) { last = s.p; since = Date.now(); continue; }
    if (Date.now() - since > 45000 && dumped < 1) {
      dumped++;
      console.log('STALLED for', Math.round((Date.now() - since) / 1000), 's at', s.p);
      try { const d = await page.eval(DIAG, 20000); d.log = d.log.slice(-6); console.log(JSON.stringify(d, null, 1)); } catch (err) { console.log('diag failed', err.message); }
      try { console.log('TRACE:\n' + (await page.eval('window.__trace.slice(-60).join("\\n")', 10000))); } catch (e) { console.log('trace failed', e.message); }
      console.log('PAGE LOGS (errors/warnings, last 30):');
      page.logs.filter(l => /error|exception|warn/i.test(l.type) || /Error|Uncaught/.test(l.text)).slice(-30).forEach(l => console.log('  [' + l.type + '] ' + l.text.slice(0, 1500)));
      since = Date.now();
    }
  }
  await recorder.stop();
  process.exit(0);
})();
