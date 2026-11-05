// Scratch probe (aiact): at each FIRST-TURN PUSH / ADVANCE evaluation of the Movement
// Phase's own choice (not a priced one), the price aiAdvanceWorth puts on it - the
// ground over the dice, the walk's square, each footprint unit's action from the walk's
// square and after the ADVANCE. Reads only (no draw from AI_RANDOM).
function installProbe() {
  var P = window.__probe = { push: [], adv: [], errors: [] };
  var r2 = function(v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : v; };
  var inChoice = 0;
  var choiceOrig = window.aiUnitMoveChoice;
  window.aiUnitMoveChoice = function(unit, opts) {
    var priced = !!(opts && opts.priced);
    if (!priced) inChoice++;
    try { return choiceOrig.apply(this, arguments); } finally { if (!priced) inChoice--; }
  };
  var detail = function(unit, dest, walk) {
    var here = { col: unit.col, row: unit.row };
    var members = footprintMembers(unit).map(function(m) {
      return { name: m.name, walk: r2(_aiRoundActionAt(unit, m, walk || here, false)), after: r2(_aiRoundActionAt(unit, m, dest, true)) };
    });
    return {
      dest: dest.col + ',' + dest.row, walk: walk ? walk.col + ',' + walk.row : 'stay',
      expected: r2(aiAdvanceExpectedScore(unit, dest)), floor: r2(_aiChargeFloorGround(unit, walk)),
      forgone: r2(aiForgoneActions(unit, 'advance', dest, walk)), worth: r2(aiAdvanceWorth(unit, dest, walk)), members: members,
    };
  };
  var pushOrig = window._aiEvalFirstTurnPush;
  window._aiEvalFirstTurnPush = function(unit, normalPick) {
    var out = pushOrig.apply(this, arguments);
    if (!inChoice || G.phase !== 'BATTLE') return out;
    try {
      var cand = out && out.shouldAdvance ? out : (normalPick ? _aiFirstTurnPushPick(unit, normalPick) : null);
      var row = { round: G.round, player: unit.player, unit: unit.name, at: unit.col + ',' + unit.row, pushes: !!(out && out.shouldAdvance) };
      if (cand && cand.shouldAdvance) Object.assign(row, detail(unit, cand.dest, normalPick));
      else row.noCandidate = true;
      P.push.push(row);
    } catch (e) { P.errors.push('push ' + e.message); }
    return out;
  };
  var advOrig = window._aiEvalAdvance;
  window._aiEvalAdvance = function(unit) {
    var out = advOrig.apply(this, arguments);
    if (!inChoice || G.phase !== 'BATTLE' || !out || !out.shouldAdvance) return out;
    try {
      P.adv.push(Object.assign({ round: G.round, player: unit.player, unit: unit.name, at: unit.col + ',' + unit.row }, detail(unit, out.dest, null)));
    } catch (e) { P.errors.push('adv ' + e.message); }
    return out;
  };
  return 'ok';
}
