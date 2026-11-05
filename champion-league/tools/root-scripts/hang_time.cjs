// Replays one battle with no 30 s limit on a page call and times the AI's transport cargo
// planning, so a step that blocks the page shows how long it takes and what it spends on.
// Usage: node hang_time.cjs <faction/formation A> <faction/formation B> <seed> [rounds]
const path = require('path');
const REPO = '/home/user/warfront';
const { recordBattle, startRecorder, parseSide } = require(path.join(REPO, 'scripts/battle_report/record.cjs'));

const [a, b, seed, rounds] = process.argv.slice(2);
const STOP_ROUND = Number(rounds || 2);

const WRAP = `(() => {
  const T = window.__cargoTimes = [];
  const depth = { cargo: 0 };
  const wrap = (name, tag) => {
    const fn = window[name];
    if (typeof fn !== 'function') { T.push({ name, missing: true }); return; }
    window[name] = function() {
      const t0 = performance.now();
      if (tag) depth[tag]++;
      try { return fn.apply(this, arguments); }
      finally {
        if (tag) depth[tag]--;
        const ms = performance.now() - t0;
        if (ms > 200 || tag) T.push({ name, ms: Math.round(ms), round: G.round, phase: G.battlePhase, inCargo: depth.cargo,
          unit: arguments[0] && arguments[0].name, passenger: arguments[1] && arguments[1].name });
      }
    };
  };
  wrap('aiAssignMissives');
  wrap('aiTransportBuildIngressMissive');
  wrap('aiTransportPlanIngressMove');
  wrap('_aiTransportBestCargoDestination', 'cargo');
  wrap('aiFindGlobalBest');
})()`;

(async () => {
  const recorder = await startRecorder();
  const harness = recorder.harness;
  let page = null;
  const newPage = harness.newPage.bind(harness);
  harness.newPage = async (...args) => {
    page = await newPage(...args);
    const evalFn = page.eval.bind(page);
    page.eval = (expr, t) => evalFn(expr, Math.max(t || 0, 900000));
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await evalFn(WRAP);
    return page;
  };
  const started = Date.now();
  let busy = false;
  const timer = setInterval(async () => {
    if (!page || busy) return;
    busy = true;
    try {
      const s = await page.eval('({ round: G.round, phase: G.battlePhase })', 1000);
      if (s.round > STOP_ROUND) { await dump(); process.exit(0); }
    } catch (_e) {}
    busy = false;
  }, 20000);
  async function dump() {
    const times = await page.eval('window.__cargoTimes');
    console.log(JSON.stringify(times.filter(t => t.ms > 300 || t.name !== 'aiFindGlobalBest')).slice(0, 20000));
    console.log('elapsed', Math.round((Date.now() - started) / 1000), 's');
  }
  try {
    await recordBattle(harness, {
      a: parseSide(a), b: parseSide(b), seed: Number(seed), map: 'CROSSROADS',
      noDoctrine: true, images: false, log: line => console.log('[battle]', line, Math.round((Date.now() - started) / 1000) + 's'),
    });
  } catch (err) { console.log('battle error', err.message); }
  await dump();
  clearInterval(timer);
  await recorder.stop();
  process.exit(0);
})();
