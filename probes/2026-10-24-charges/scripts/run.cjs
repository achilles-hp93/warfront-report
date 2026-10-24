'use strict';
const fs = require('fs'); const path = require('path');
const R = '/home/user/warfront/scripts/battle_report/';
const { startRecorder } = require(R + 'record.cjs');
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(R + 'skirmish_driver.cjs');
const LEAN = ['page_recorder.js', 'page_activity.js', 'page_ai_perf.js'].map(f => fs.readFileSync(R + f, 'utf8')).join('\n');
const PROBE = fs.readFileSync(path.join(__dirname, 'page_probe.js'), 'utf8');
const [a, b, seed, map, out] = process.argv.slice(2);
const side = t => ({ faction: t.slice(0, t.indexOf('/')), formation: t.slice(t.indexOf('/') + 1) });
(async () => {
  const rec = await startRecorder({});
  try {
    const page = await rec.harness.newPage('/fantasy', 'probe');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${Number(seed)})`);
    await page.eval(`${LEAN}\ninstallBattleRecorder({images:false}); installActivityRecorder(window.__battleRecord); installAiPerfRecorder(window.__battleRecord);\n${PROBE}`);
    await chooseSkirmishAndMap(page, map);
    const order = await rollOff(page);
    await pickFormations(page, order, [side(a), side(b)]);
    await page.waitFor(`G.phase === 'BATTLE' && !!window.__battleRecord.snaps.length`, 180000);
    await playBattle(page, { log: () => {} });
    const res = await page.eval(`({ probe: window.__chgProbe, result: window.__battleRecord.result, activity: window.__battleRecord.activity,
      units: G.units.map(u => ({ uid: u.uid, name: u.name, player: u.player, rp: u.rp || 0, alive: u.alive })) })`, 120000);
    fs.writeFileSync(out, JSON.stringify(res));
    console.log(out, 'rows', res.probe.rows.length, 'err', res.probe.err || '-', 'result', JSON.stringify(res.result && res.result.vp));
  } finally { await rec.stop(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
