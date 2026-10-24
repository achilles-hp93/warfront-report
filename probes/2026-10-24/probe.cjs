// node probe.cjs <seed> <map> <a> <b> <out.json> [rounds]: the Assassins' movement choices,
// with every candidate square's score terms, for the first rounds of a battle.
const fs = require('fs');
const W = '/home/user/warfront/scripts/battle_report/';
const { startRecorder, parseSide } = require(W + 'record.cjs');
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(W + 'skirmish_driver.cjs');
const RECORDER = fs.readFileSync(W + 'page_recorder.js', 'utf8');
const PROBE = `(function() {
  var P = window.__assn = [];
  var watch = function(u) { return u && /babylonian_assassin/.test(u.templateId || ''); };
  var r2 = function(v) { return Math.round(v * 100) / 100; };
  var terms = function(bd) { var o = {}; Object.keys(bd || {}).forEach(function(k) { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) o[k] = r2(bd[k]); }); return o; };
  var shooters = function(u, sq) {
    return _aiCachedAliveUnits(1 - u.player).map(function(e) {
      var d = chebyshev(e.col, e.row, sq.col, sq.row);
      return { name: e.name, d: d, range: getEffectiveRange(e), dmg: r2(aiExpectedDamage(e, u)) };
    }).filter(function(x) { return x.d <= x.range + 3; });
  };
  var decide = window.aiDecideMovement;
  window.aiDecideMovement = function(player) {
    var out = decide.apply(this, arguments);
    if (out && watch(out.unit)) P.push({ kind: 'decision', round: G.round, type: out.type, at: [out.unit.col, out.unit.row], dest: out.dest && [out.dest.col, out.dest.row] });
    return out;
  };
  var choose = window.aiChooseDestination;
  window.aiChooseDestination = function(unit, squares, opts) {
    var out = choose.apply(this, arguments);
    if (watch(unit)) {
      try {
        var scored = (squares || []).map(function(sq) { return { sq: sq, s: aiScoreDestination(unit, sq) }; }).sort(function(a, b) { return b.s - a.s; });
        var stay = aiScoreDestinationBreakdown(unit, { col: unit.col, row: unit.row });
        P.push({ kind: 'choose', round: G.round, phase: G.battlePhase, opts: opts && Object.keys(opts), at: [unit.col, unit.row], squares: (squares || []).length,
          pick: out && [out.col, out.row, r2(out.score || 0)], stay: terms(stay),
          top: scored.slice(0, 5).map(function(x) { return { at: [x.sq.col, x.sq.row], s: r2(x.s), t: terms(aiScoreDestinationBreakdown(unit, x.sq)) }; }),
          safest: scored.slice().sort(function(a, b) { return (aiScoreDestinationBreakdown(unit, b.sq).threat || 0) - (aiScoreDestinationBreakdown(unit, a.sq).threat || 0); }).slice(0, 2).map(function(x) { return { at: [x.sq.col, x.sq.row], s: r2(x.s), t: terms(aiScoreDestinationBreakdown(unit, x.sq)) }; }),
          shootersAtPick: out ? shooters(unit, out) : null,
          missive: aiGetMissive(unit) && aiGetMissive(unit).type,
          global: (function() { var g = _aiCachedGlobalBest(unit); return g && [g.col, g.row, r2(g.score), g.turnsAway]; })() });
      } catch (e) { P.push({ err: String(e && e.stack) }); }
    }
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
