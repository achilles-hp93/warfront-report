(function() {
  var res = {};
  var realChances = advanceRollChances;
  var realAdvance = _aiEvalAdvance;
  _pmBoard(function() {
    var fresh = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
    AI.player = 0; G.round = 1; G.battlePhase = 'COMMAND';
    _aiEvalAdvance = function() { return { shouldAdvance: false }; };
    try {
      var squad = _pmSquad(0, 7, 12);
      var dice = realChances(squad);
      var mean = advanceExpectedSuccesses(squad);
      res.mean = mean; res.dice = dice;
      [null, mean, 0].forEach(function(k) {
        var chances = k == null ? null : dice.map(function(p, j) { return j === k ? 1 : 0; });
        advanceRollChances = chances ? function() { return chances; } : realChances;
        fresh();
        res['k' + k] = aiWithMoveEvalCache(function() {
          var without = aiUnitMoveChoice(squad, { priced: true });
          var pick = _aiPricedDestination(squad);
          var pp = _aiFirstTurnPushPick(squad, pick);
          var info = { without: without && [without.type, without.dest.col, without.dest.row, without.worth], pick: pick && [pick.col, pick.row],
            floor: _aiChargeFloorGround(squad, pick) };
          if (pp.shouldAdvance) { info.pp = [pp.dest.col, pp.dest.row]; info.exp = aiAdvanceExpectedScore(squad, pp.dest); info.rolls = aiAdvanceRollSquares(squad, pp.dest).map(function(r) { return r.chance + '@' + r.sq.col + ',' + r.sq.row; }); }
          info.plan = aiExtraMoveChoice(squad, 2);
          info.plan = { gain: info.plan.gain, choice: info.plan.choice && [info.plan.choice.type, info.plan.choice.dest.col, info.plan.choice.dest.row, info.plan.choice.worth] };
          return info;
        });
      });
    } finally { advanceRollChances = realChances; _aiEvalAdvance = realAdvance; }
  });
  return res;
})()
