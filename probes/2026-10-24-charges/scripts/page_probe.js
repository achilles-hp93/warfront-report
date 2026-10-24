// Scratch probe: every AI movement decision for a unit with a charge on offer.
(function() {
  var P = window.__chgProbe = { rows: [], offers: {} };
  var cur = null;           // the unit being decided: its charge candidates and floor
  var realScore = _aiScoreChargeSquare;
  _aiScoreChargeSquare = function(unit, sq, stayScore) {
    var out = realScore.apply(this, arguments);
    if (!out) return out;
    try {
      var targets = getChargeTargets(unit, sq.col, sq.row);
      var taken = _aiChargeMeleeTaken(unit, sq.col, sq.row);
      var best = null;
      targets.forEach(function(t) {
        var dealt = aiFootprintMeleeDamage(unit, t);
        var deny = aiExpectedRangedDamage(t, unit);
        var losing = _aiChargeLosingFight(unit, t, dealt, taken);
        var v = (dealt - taken * aiW('CHARGE_TAKEN_RISK')) * aiW('W_CHARGE_COMBAT') + deny * aiW('W_CHARGE_DENY_RANGED') - losing * aiW('W_CHARGE_LOSING');
        if (!best || v > best.v) best = { v: v, t: t, dealt: dealt, deny: deny, losing: losing, ranged: aiFootprintRangedDamage(unit, t) };
      });
      var meleeFocused = best.dealt > 0 && best.dealt >= best.ranged;
      var c = { col: sq.col, row: sq.row, score: out.score, P: out.success, target: best.t.name, tuid: best.t.uid,
        tval: aiTargetValue(best.t), dealt: best.dealt, taken: taken, deny: best.deny, losing: best.losing, rangedOnTarget: best.ranged,
        meleeFocused: meleeFocused, contests: _aiChargeContestsObjective(unit, sq),
        dest: aiScoreDestination(unit, sq), stay: stayScore != null ? stayScore : aiScoreDestination(unit, { col: unit.col, row: unit.row }) };
      if (!cur || cur.uid !== unit.uid) cur = { uid: unit.uid, best: null };
      if (!cur.best || out.score > cur.best.score) cur.best = c;
      var key = G.round + ':' + unit.uid;
      var o = P.offers[key];
      if (!o || o.stamp !== P.stamp) o = P.offers[key] = { round: G.round, uid: unit.uid, name: unit.name, player: unit.player, rp: unit.rp || 0, stamp: P.stamp, best: null, outcome: 'deferred', from: { col: unit.col, row: unit.row }, held: !!_aiObjectiveHeldBy(unit), maxMelee: meleeHp(unit) };
      if (!o.best || out.score > o.best.score) o.best = c;
    } catch (e) { P.err = String(e); }
    return out;
  };
  var realFloor = _aiChargeFloor;
  _aiChargeFloor = function(unit, walk, charge) {
    var f = realFloor.apply(this, arguments);
    if (cur && cur.uid === unit.uid) { cur.floor = f; cur.walk = walk ? { col: walk.col, row: walk.row } : null; }
    var o = P.offers[G.round + ':' + unit.uid]; if (o && o.stamp === P.stamp) { o.floor = f; o.walk = walk ? { col: walk.col, row: walk.row } : null; o.walkDest = walk ? aiScoreDestination(unit, walk) : null; }
    return f;
  };
  // The best shot the unit could take from (col,row): AI's own expected ranged damage x target value.
  function bestShot(unit, col, row) {
    if (!Weapons.groups(unit, 'ranged').length) return { hp: 0, worth: 0, target: null };
    var rng = getEffectiveRange(unit);
    var fake = Object.assign({}, unit, { col: col, row: row });
    var best = { hp: 0, worth: 0, target: null };
    aliveUnits(1 - unit.player).filter(unitOnBoard).forEach(function(e) {
      var d = chebyshev(col, row, e.col, e.row);
      if (d > rng || d <= 1) return;
      if (!hasLOS(fake, e, { ignoreUnit: unit })) return;
      var hp = withFootprintAt(unit, col, row, function() { return aiExpectedRangedDamage(unit, e); });
      var w = hp * aiTargetValue(e);
      if (w > best.worth) best = { hp: hp, worth: w, target: e.name };
    });
    return best;
  }
  function meleeHp(unit) {
    var best = 0;
    aliveUnits(1 - unit.player).filter(unitOnBoard).forEach(function(e) { best = Math.max(best, aiFootprintMeleeDamage(unit, e)); });
    return best;
  }
  var realDecide = aiDecideMovement;
  aiDecideMovement = function(player) {
    cur = null; P.stamp = (P.stamp || 0) + 1;
    var res = realDecide.apply(this, arguments);
    try { if (res && res.unit) { var oo = P.offers[G.round + ':' + res.unit.uid]; if (oo && oo.stamp === P.stamp) oo.outcome = res.type; } } catch (e) {}
    try {
      if (res && res.unit && cur && cur.uid === res.unit.uid && cur.best) {
        var u = res.unit;
        var walk = cur.walk || { col: u.col, row: u.row };
        var shotWalk = bestShot(u, walk.col, walk.row);
        var shotHere = bestShot(u, u.col, u.row);
        var held = _aiObjectiveHeldBy(u);
        P.rows.push({ round: G.round, player: player, uid: u.uid, name: u.name, rp: u.rp || 0, type: res.type,
          from: { col: u.col, row: u.row }, charge: cur.best, floor: cur.floor, walk: cur.walk,
          walkDest: cur.walk ? aiScoreDestination(u, cur.walk) : null,
          shotWalk: shotWalk, shotHere: shotHere, maxMelee: meleeHp(u), held: held ? true : false,
          chargedTo: res.type === 'charge' ? { col: res.dest.col, row: res.dest.row } : null });
      }
    } catch (e) { P.err = String(e); }
    return res;
  };
})();
