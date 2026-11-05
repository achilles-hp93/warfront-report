// What happens on the page while a worker decision is in flight: Math.random draws
// (with stacks) and AI memory changes. usage: node probe_think.cjs <repo> <seed> <a> <b> [maxRound]
const path = require('path');
const repo = process.argv[2];
const seed = Number(process.argv[3] || 1);
const sideA = process.argv[4], sideB = process.argv[5];
const maxRound = Number(process.argv[6] || 3);
const { startOutputServer, startChrome, BrowserQaHarness } = require(path.join(repo, 'scripts/browser_qa/common_cdp.cjs'));
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(path.join(repo, 'scripts/battle_report/skirmish_driver.cjs'));
const side = s => ({ faction: s.slice(0, s.indexOf('/')), formation: s.slice(s.indexOf('/') + 1) });

const PROBE = `(() => {
  const P = window.__think = { draws: [], memChanges: [], asks: 0 };
  const realRandom = Math.random;
  Math.random = function() {
    if (window._aiDecisionInFlight) P.draws.push({ round: G.round, phase: G.battlePhase, stack: new Error().stack.split('\\n').slice(2, 7).join(' | ') });
    return realRandom.apply(this, arguments);
  };
  const canon = v => JSON.stringify(v, (k, x) => x instanceof Set ? ['Set', ...x] : x instanceof Map ? ['Map', ...x] : x);
  const realVictory = showVictory; showVictory = function() { window.__over = true; return realVictory.apply(this, arguments); };
  const realReq = aiDecisionRequest;
  aiDecisionRequest = function() {
    const r = realReq.apply(this, arguments);
    P.sent = {}; Object.keys(r.memory.fields).forEach(k => P.sent[k] = canon(r.memory.fields[k]));
    P.asks++;
    return r;
  };
  const realApply = aiApplyDecisionAnswer;
  aiApplyDecisionAnswer = function(answer) {
    const now = aiMemoryTake(aiBattleIndex()).fields;
    const changed = Object.keys(Object.assign({}, now, P.sent)).filter(k => canon(now[k]) !== P.sent[k]);
    if (changed.length) P.memChanges.push({ round: G.round, phase: G.battlePhase, changed, detail: changed.map(k => k + ': sent ' + (P.sent[k] || '').slice(0, 300) + ' NOW ' + canon(now[k]).slice(0, 300)) });
    return realApply.apply(this, arguments);
  };
  return true;
})()`;

(async () => {
  const server = await startOutputServer();
  const chrome = await startChrome({});
  const harness = new BrowserQaHarness(server.baseUrl, chrome.browserWsUrl);
  try {
    const page = await harness.newPage('/fantasy', 'probe');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${seed})`);
    await page.eval(`setAiDecisionThread('worker'); true`);
    await page.eval(PROBE);
    await chooseSkirmishAndMap(page, 'ACROPOLIS');
    const order = await rollOff(page);
    await pickFormations(page, order, [side(sideA), side(sideB)]);
    await Promise.race([
      playBattle(page, { log: l => console.log('  ' + l) }),
      (async () => { for (;;) { await new Promise(r => setTimeout(r, 1000)); if (await page.eval('window.__over ? 999 : G.round') > maxRound) return; } })(),
    ]);
    const out = await page.eval(`({ asks: __think.asks, byFn: __think.draws.reduce((m, d) => { const k = d.stack.split(" | ").slice(0, 2).map(s => s.trim().split(" ")[1]).join(" < "); m[k] = (m[k] || 0) + 1; return m; }, {}), nDraws: __think.draws.length, memChanges: __think.memChanges.slice(0, 10), nMem: __think.memChanges.length })`);
    console.log(JSON.stringify(out, null, 1));
  } finally {
    harness.close(); await chrome.stop(); server.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
