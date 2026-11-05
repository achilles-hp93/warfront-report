// Start an AI-vs-AI skirmish in the built page, wait for round N, pause the AI,
// and report what G holds that structured clone cannot carry, and timings.
const path = require('path');
const repo = process.argv[2];
const waitRound = Number(process.argv[3] || 2);
const { startOutputServer, startChrome, BrowserQaHarness } = require(path.join(repo, 'scripts/browser_qa/common_cdp.cjs'));
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, acknowledgeDice } = require(path.join(repo, 'scripts/battle_report/skirmish_driver.cjs'));

const ANALYZE = `(() => {
  const out = { fns: [], dom: [], weak: [], protos: {}, topKeys: Object.keys(G).length, rootRefs: [] };
  const seen = new Map();
  let objects = 0;
  const walk = (v, p, depth) => {
    if (v === null || typeof v !== 'object') {
      if (typeof v === 'function' && out.fns.length < 40) out.fns.push(p);
      if (typeof v === 'symbol') out.fns.push('SYMBOL ' + p);
      return;
    }
    if (v === G && p !== 'G') { out.rootRefs.push(p); return; }
    if (seen.has(v)) return;
    seen.set(v, p);
    objects++;
    if (typeof Node !== 'undefined' && v instanceof Node) { if (out.dom.length < 40) out.dom.push(p + ' ' + v.constructor.name); return; }
    if (v instanceof WeakMap || v instanceof WeakSet || v instanceof Promise) { out.weak.push(p); return; }
    const proto = Object.getPrototypeOf(v);
    const pn = proto === Object.prototype ? 'Object' : proto === Array.prototype ? 'Array' : proto === null ? 'null' : (proto.constructor && proto.constructor.name) || '?';
    out.protos[pn] = (out.protos[pn] || 0) + 1;
    if (!['Object', 'Array', 'Map', 'Set', 'null'].includes(pn) && !out.protos['ex:' + pn]) out.protos['ex:' + pn] = p;
    if (v instanceof Map) { v.forEach((x, k) => { walk(k, p + '.<k>', depth + 1); walk(x, p + '.<' + String(k) + '>', depth + 1); }); return; }
    if (v instanceof Set) { v.forEach(x => walk(x, p + '.<s>', depth + 1)); return; }
    for (const k of Object.keys(v)) {
      const d = Object.getOwnPropertyDescriptor(v, k);
      if (d && (d.get || d.set)) { out.fns.push('ACCESSOR ' + p + '.' + k); continue; }
      walk(v[k], p + '.' + k, depth + 1);
    }
  };
  const t0 = performance.now();
  walk(G, 'G', 0);
  out.walkMs = performance.now() - t0;
  out.objects = objects;
  // structured clone attempt on a JSON-safe-ish copy: just try G directly
  try { const t1 = performance.now(); structuredClone(G); out.cloneMs = performance.now() - t1; } catch (e) { out.cloneErr = e.message.slice(0, 200); }
  const t2 = performance.now(); const j = JSON.stringify(G, (k, v) => typeof v === 'function' ? undefined : (typeof Node !== 'undefined' && v instanceof Node) ? undefined : v); out.jsonMs = performance.now() - t2; out.jsonBytes = j.length;
  const t3 = performance.now(); const c = getBattleStateChecksum(); out.checksumMs = performance.now() - t3;
  out.unitKeys = Object.keys(G.units[0] || {}).length;
  out.gKeys = Object.keys(G).filter(k => { const v = G[k]; return v && typeof v === 'object'; }).map(k => k + ':' + (JSON.stringify(G[k], (kk, vv) => typeof vv === 'function' ? undefined : (typeof Node !== 'undefined' && vv instanceof Node) ? undefined : vv) || '').length).sort((a, b) => Number(b.split(':')[1]) - Number(a.split(':')[1])).slice(0, 25);
  return out;
})()`;

(async () => {
  const server = await startOutputServer();
  const chrome = await startChrome({});
  const harness = new BrowserQaHarness(server.baseUrl, chrome.browserWsUrl);
  try {
    const page = await harness.newPage('/fantasy', 'probe');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(1)`);
    await chooseSkirmishAndMap(page, 'ACROPOLIS');
    const order = await rollOff(page);
    await pickFormations(page, order, [{ faction: 'iron_imperium', formation: 'preset:legatus_legion' }, { faction: 'british_liberation_front', formation: 'preset:merlin_army' }]);
    await page.waitFor(`G.phase === 'BATTLE'`, 180000);
    for (;;) {
      await acknowledgeDice(page);
      const s = await page.eval(`({ round: G.round, phase: G.battlePhase, acting: !!G.aiActing })`);
      if (s.round >= waitRound && s.phase === 'ACTION') break;
      if (s.phase === 'CLEANUP') await page.eval(`(() => { const b = document.getElementById('btn-end-phase'); if (b && !G.aiActing) b.click(); })()`);
      await new Promise(r => setTimeout(r, 300));
    }
    // stop the AI
    await page.eval(`AI.enabled = false, true`);
    await new Promise(r => setTimeout(r, 1500));
    const res = await page.eval(ANALYZE, 120000);
    console.log(JSON.stringify(res, null, 1));
  } finally {
    harness.close(); await chrome.stop(); server.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
