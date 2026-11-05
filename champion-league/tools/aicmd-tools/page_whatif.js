// Scratch page probe (not committed): on the board the battle has now - played by the build
// the page loaded - what the NEW AI code (window.__aicmdNewSource, the changed engine files)
// would decide. Each question swaps the new definitions in, asks on a scratch cache, and
// swaps the old ones back, AI memory put back, no die rolled: the battle plays on unchanged.
(function() {
  var SRC = window.__aicmdNewSource;
  var R = window.__battleRecord;
  if (!SRC || !R || !R.probe) return;
  var P = R.probe;
  P.whatifHq = []; P.whatifLeaves = []; P.whatifErrors = [];
  var names = [];
  SRC.replace(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm, function(m, n) { if (names.indexOf(n) < 0) names.push(n); return m; });
  SRC.replace(/^var\s+([A-Za-z_$][\w$]*)\s*=/gm, function(m, n) { if (names.indexOf(n) < 0) names.push(n); return m; });
  // The two the what-if wraps below are never asked of the new code: left out of the swap,
  // so putting the old definitions back keeps the wrappers.
  var oldDefs = {}, newDefs = {};
  names.forEach(function(n) { oldDefs[n] = window[n]; });
  (0, eval)(SRC);
  names.forEach(function(n) { newDefs[n] = window[n]; window[n] = oldDefs[n]; });
  names = names.filter(function(n) { return n !== 'aiChooseHQCommand' && n !== 'aiDecideMovement'; });
  var r2 = function(x) { return x == null ? x : Math.round(x * 100) / 100; };
  var nm = function(t) { return t ? (t.name || (t.col != null ? t.col + ',' + t.row : '?')) : null; };
  function withNew(fn) {
    var keep = { gt: Object.assign({}, AI.globalTargets || {}), bm: Object.assign({}, AI.boughtMoves || {}), held: AI.heldObjectives,
      mop: AI.moveOrderPlan, ap: AI.advancePlan, def: AI._deferred, player: AI.player, posture: AI.posture };
    names.forEach(function(n) { window[n] = newDefs[n]; });
    try { return _aiWithScratchMoveEvalCache(fn); } finally {
      names.forEach(function(n) { window[n] = oldDefs[n]; });
      AI.globalTargets = keep.gt; AI.boughtMoves = keep.bm; AI.heldObjectives = keep.held; AI.moveOrderPlan = keep.mop;
      AI.advancePlan = keep.ap; AI._deferred = keep.def; AI.player = keep.player; AI.posture = keep.posture;
    }
  }
  window.__aicmdWhatIf = withNew;

  var oldChoose = window.aiChooseHQCommand;
  window.aiChooseHQCommand = function(player) {
    try {
      var cands = withNew(function() { return aiBuildHQCommandCandidates(player); });
      // Each Double Time target: what the new pricing reads (first reading, choices).
      var dts = withNew(function() {
        var out = [];
        _aiCommandFriendlies(player).forEach(function(u) {
          if (u.isHQ || !(u.tags || []).includes('INFANTRY') || !aiUnitMovesThisRound(u)) return;
          var walk = _aiExtraMoveWalk(u, 2), charge = _aiExtraMoveCharge(u, 2, { player: player });
          var first = Math.max(0, Math.max(walk.with, charge.with) - Math.max(walk.without, charge.without));
          if (!(first > 1)) return;
          var without = aiUnitMoveChoice(u, { priced: true });
          var ch = aiExtraMoveChoice(u, 2);
          out.push({ unit: u.name, first: r2(first), without: without && [without.type, without.dest.col, without.dest.row, r2(aiUnitMoveChoiceGain(u, without))],
            with: ch.choice && [ch.choice.type, ch.choice.dest.col, ch.choice.dest.row], gain: r2(ch.gain) });
        });
        return out;
      });
      P.whatifHq.push({ round: G.round, player: player, cp: G.players[player].cp, issued: G.players[player].commandsIssuedThisPhase || 0,
        cands: cands.map(function(c) { return [c.cmd.name, nm(c.target), r2(c.weight), c.cpCost]; }), dts: dts });
    } catch (e) { P.whatifErrors.push('hq ' + e + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
    return oldChoose.apply(this, arguments);
  };

  var oldDecide = window.aiDecideMovement;
  window.aiDecideMovement = function(player) {
    var out = oldDecide.apply(this, arguments);
    try {
      var u = out && out.unit, dest = out && out.dest;
      var held = u && dest && (G.objectives || []).filter(function(o) { return inObjectiveAreaOf(o, u.col, u.row); })[0];
      if (held && !inObjectiveAreaOf(held, dest.col, dest.row)) {
        var rec = withNew(function() {
          AI.player = u.player;
          var stake = aiPresenceVpAtStake(u, dest), rate = aiPresenceVpRate(u);
          var choice = null, fb = null;
          if (unitInZOC(u)) { var f = _aiEvalFallBack(u); fb = f.shouldFallBack ? [f.dest.col, f.dest.row] : 'stays'; }
          else choice = aiUnitMoveChoice(u, { priced: true });
          return { stake: r2(stake), rate: r2(rate), points: r2(aiPresenceStakePoints(u, dest)),
            newChoice: choice ? [choice.type, choice.dest.col, choice.dest.row, inObjectiveAreaOf(held, choice.dest.col, choice.dest.row) ? 'stays in area' : 'LEAVES'] : (fb ? null : 'stays'),
            newFallBack: fb };
        });
        rec.round = G.round; rec.unit = u.name; rec.at = [u.col, u.row]; rec.obj = [held.col, held.row];
        rec.old = [out.type, dest.col, dest.row];
        P.whatifLeaves.push(rec);
      }
    } catch (e) { P.whatifErrors.push('move ' + e + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
    return out;
  };
})();
