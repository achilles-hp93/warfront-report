// Replay a battle as record.cjs does, with the AI probe on: node run_probe.cjs <seed> <map> <a> <b> <out.json> <watch names...>
const fs = require('fs');
const path = require('path');
const W = '/home/user/warfront/scripts/battle_report/';
const { startRecorder, parseSide } = require(W + 'record.cjs');
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(W + 'skirmish_driver.cjs');
const RECORDER = ['page_recorder.js', 'page_attribution.js', 'page_activity.js', 'page_fallback.js', 'page_effects.js', 'page_passives.js']
  .map(f => fs.readFileSync(W + f, 'utf8')).join('\n');
const PROBE = fs.readFileSync(path.join(__dirname, 'probe_page.js'), 'utf8');
(async () => {
  const [seed, map, a, b, out, ...watch] = process.argv.slice(2);
  const rec = await startRecorder({});
  try {
    const page = await rec.harness.newPage('/fantasy', 'battle-report');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${Number(seed)})`);
    await page.eval(`${RECORDER}\ninstallBattleRecorder({ images: false }); installVpAttribution(window.__battleRecord); installActivityRecorder(window.__battleRecord); installFallBackRecorder(window.__battleRecord); installEffectsRecorder(window.__battleRecord); installPassivesRecorder(window.__battleRecord)`);
    console.log(await page.eval(`${PROBE}\ninstallAiProbe(${JSON.stringify(watch)}); installMissiveProbe(${JSON.stringify(watch)}); installObjectiveProbe(${JSON.stringify(watch[0])}); installChargeProbe(${JSON.stringify(watch)})`));
    await chooseSkirmishAndMap(page, map);
    const order = await rollOff(page);
    await pickFormations(page, order, [parseSide(a, '--a'), parseSide(b, '--b')]);
    await page.waitFor(`G.phase === 'BATTLE' && !!window.__battleRecord.snaps.length`, 180000);
    await playBattle(page, { log: console.log });
    const res = await page.eval(`({ result: window.__battleRecord.result, probe: window.__probe,
      log: G.combatLog.map(e => ({ round: e.round, phase: e.phase, msg: e.msg })) })`, 120000);
    fs.writeFileSync(out, JSON.stringify(res));
    console.log('result', JSON.stringify(res.result), 'probe entries', res.probe.length);
    await page.close();
  } finally { await rec.stop(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
