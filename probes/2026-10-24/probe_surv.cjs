// node probe.cjs <seed> <map> <a> <b> <out.json> [rounds]: the Assassins' movement choices,
// with every candidate square's score terms, for the first rounds of a battle.
const fs = require('fs');
const W = '/home/user/warfront/scripts/battle_report/';
const { startRecorder, parseSide } = require(W + 'record.cjs');
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(W + 'skirmish_driver.cjs');
const RECORDER = fs.readFileSync(W + 'page_recorder.js', 'utf8');
const PROBE = `(function() {
  var P = window.__assn = [];
  var r2 = function(v) { return Math.round(v * 1000) / 1000; };
  var choose = window.aiChooseDestination;
  window.aiChooseDestination = function(unit, squares, opts) {
    var out = choose.apply(this, arguments);
    try {
      if (G.round <= 2 && G.battlePhase === 'MOVEMENT') {
        var hp = _aiCurrentHP(unit);
        var objs = (G.objectives || []).map(function(o) { return { at: [o.col, o.row], s: r2(_aiObjectiveSurvival(unit, o.col, o.row)) }; });
        var at = out ? { col: out.col, row: out.row } : { col: unit.col, row: unit.row };
        var bd = aiScoreDestinationBreakdown(unit, at);
        P.push({ round: G.round, player: unit.player, name: unit.name, hp: hp, objs: objs, pick: [at.col, at.row], moved: !!out,
          pickSurv: r2(_aiObjectiveSurvival(unit, at.col, at.row)), objective: r2(bd.objective), risk: r2(bd.objective_risk || 0) });
      }
    } catch (e) { P.push({ err: String(e && e.stack) }); }
    return out;
  };
return 'assassin probe on';
})()`;
(async () => {
  const [seed, map, a, b, out, rounds] = process.argv.slice(2);
  const rec = await startRecorder({});
  try {
    const page = await rec.harness.newPage('/fantasy', 'battle-report');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${Number(seed)})`);
    await page.eval(`${RECORDER}\ninstallBattleRecorder({ images: false })`);
    console.log(await page.eval(PROBE));
    await chooseSkirmishAndMap(page, map);
    const order = await rollOff(page);
    await pickFormations(page, order, [parseSide(a, '--a'), parseSide(b, '--b')]);
    await page.waitFor(`G.phase === 'BATTLE' && !!window.__battleRecord.snaps.length`, 180000);
    const stopAt = Number(rounds || 1) + 1;
    await playBattle(page, { log: console.log, onRound: async r => { if (r >= stopAt) throw new Error('rounds played'); } }).catch(e => console.log('stopped', e.message));
    const res = await page.eval(`({ probe: window.__assn, log: G.combatLog.filter(function(e) { return e.round <= ${Number(rounds || 1)}; }).map(function(e) { return e.round + ' ' + e.phase + ' ' + e.msg; }) })`, 120000);
    fs.writeFileSync(out, JSON.stringify(res, null, 1));
    console.log('entries', res.probe.length);
    await page.close();
  } finally { await rec.stop(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
