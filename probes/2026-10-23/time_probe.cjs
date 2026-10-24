// Replay a battle with timers on AI functions: node time_probe.cjs <seed> <map> <a> <b> <out.json> <maxRound>
const fs = require('fs');
const W = '/home/user/warfront/scripts/battle_report/';
const { startRecorder } = require(W + 'record.cjs');
const { parseSide } = require(W + 'record.cjs');
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(W + 'skirmish_driver.cjs');
const TIMERS = `(function(names) {
  const T = window.__timing = {};
  names.forEach(function(n) {
    const orig = window[n];
    if (typeof orig !== 'function') { T[n] = { missing: true }; return; }
    const t = T[n] = { calls: 0, ms: 0, max: 0, maxAt: null };
    window[n] = function() {
      const s = performance.now();
      try { return orig.apply(this, arguments); }
      finally {
        const d = performance.now() - s;
        t.calls++; t.ms += d;
        if (d > t.max) { t.max = d; const u = arguments[0]; t.maxAt = { round: G.round, phase: G.battlePhase, unit: u && u.name, n: arguments.length }; }
      }
    };
  });
  return 'timers ok';
})`;
const NAMES = ['_aiThreatExposure', '_aiScreeningValue', '_aiScoutCaution', '_aiSafetyValue', '_aiRangePositionScore', '_aiOwnMarkerCost', '_aiObjectiveScore', '_aiObjectiveHoldPressure', '_aiObjectiveDriftPenalty', '_aiLeaderAttachDestinationBonus', '_aiGroundScore', '_aiFriendlySupport', '_aiComputeRoleAdj', '_aiCaptureBlockerMoveBonus', 'aiMissiveMovementBonus', '_aiNearestObjSaturation', 'aiScoreDestination', '_aiMoveFirePenalty', 'aiKeptGlobalPlan', 'immediateMoveSquares', '_aiOffensivePotential', '_aiFireKeptAt', 'aiGetUsableAttackProfiles', '_aiStandingFireShare', 'aiWithMoveEvalCache', '_aiResetMoveEvalCache', 'aiChooseActionPhase', '_aiCollectActions', '_aiCollectMagicActions', '_aiCollectRiteActions', '_aiCollectChannelManaActions',
  '_aiManaBankingWorth', '_aiBestPotentialRiteScore', '_aiScoreManaBankingAbility', 'aiChooseDestination', '_aiPickDestination',
  '_aiCommandRepositionPlan', 'aiRepositionSquare', 'aiDecideMovement', 'aiChooseHQCommand', 'aiFindGlobalBest', '_aiScoreRiteSquare', 'riteTargetSquares', 'riteTargets'];
(async () => {
  const [seed, map, a, b, out, maxRound] = process.argv.slice(2);
  const rec = await startRecorder({});
  try {
    const page = await rec.harness.newPage('/fantasy', 'battle-report');
    const origEval = page.eval.bind(page);
    page.eval = (e, t) => origEval(e, Math.max(t || 0, 900000));
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${Number(seed)})`);
    console.log(await page.eval(`${TIMERS}(${JSON.stringify(NAMES)})`));
    await chooseSkirmishAndMap(page, map);
    const order = await rollOff(page);
    await pickFormations(page, order, [parseSide(a, '--a'), parseSide(b, '--b')]);
    await page.waitFor(`G.phase === 'BATTLE'`, 180000);
    // Watchdog: when the page's main thread does not answer, pause it and print its stack.
    let samples = 0;
    const origOnEvent = page._onEvent.bind(page);
    page._onEvent = (msg) => {
      if (msg.method === 'Debugger.paused') {
        const frames = (msg.params.callFrames || []).slice(0, 40).map(f => (f.functionName || '(anon)') + ':' + f.location.lineNumber);
        console.log('STACK', samples, frames.join(' < '));
        page.send('Debugger.resume').catch(() => {});
        return;
      }
      origOnEvent(msg);
    };
    await page.send('Debugger.enable');
    const watchdog = setInterval(async () => {
      try { await page.send('Runtime.evaluate', { expression: '1' }, 4000); }
      catch (e) {
        if (samples++ < 12) console.log('busy', new Date().toISOString());
      }
    }, 5000);
    const dump = async (label) => { const t = await page.eval(`JSON.stringify(window.__timing)`); fs.writeFileSync(out, t); console.log(label, t.slice(0, 2000)); };
    const timer = setInterval(() => dump('periodic').catch(() => {}), 15000);
    try {
      await playBattle(page, { log: (l) => { console.log(l); if (Number((l.match(/round (\d+)/) || [])[1]) > Number(maxRound || 99)) throw new Error('stop at round ' + l); }, stallMs: 900000 });
    } catch (e) { console.log('stopped:', e.message); }
    clearInterval(timer); clearInterval(watchdog);
    await dump('final');
    await page.close();
  } finally { await rec.stop(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
