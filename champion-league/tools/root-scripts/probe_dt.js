(function() {
  return _withCleanBoard(function() {
    var saved = { phase: G.phase, bp: G.battlePhase, round: G.round, obj: G.objectives, player: AI.player, miss: AI.missives };
    try {
      G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.round = 1;
      G.objectives = [{ col: 7, row: 7, vp: 3, owner: null }, { col: 1, row: 7, vp: 2, owner: null }, { col: 13, row: 7, vp: 2, owner: null }];
      AI.player = 0; AI.missives = {};
      var custos = _place(createUnit('iron_imperium:palatine_custos', 0), 2, 14);
      var foe = _place(createUnit('covenant_of_new_jerusalem:covenant_levies', 1), 7, 1);
      [custos, foe].forEach(function(u) { u.intelLevel = [1, 1]; u.ap = 1; u.moved = false; });
      _aiResetMoveEvalCache();
      aiAssignMissives();
      var effect = { op: 'mod_stat', stat: 'MOVE', amount: 2, duration: 'this_round', target: 'target', source: 'DOUBLE TIME' };
      var pick = function() {
        _aiResetMoveEvalCache();
        return aiWithMoveEvalCache(function() {
          var squares = _aiCachedReachableSquares(custos, 0);
          var p = aiChooseDestination(custos, squares, { greedy: true });
          return { move: Stats.unit(custos, 'MOVE').value, mp: getMovementPoints(custos), n: squares.length, pick: p && [p.col, p.row, +p.score.toFixed(2)], toward: p && p.toward && [p.toward.col, p.toward.row] };
        });
      };
      var without = pick();
      var withBuff = aiWithBuffOn(null, [effect], custos, 'DOUBLE TIME', pick);
      var gain = aiWithMoveEvalCache(function() { return _aiCommandExtraMoveGain(custos, 2); });
      return { missive: aiGetMissive(custos), without: without, withBuff: withBuff, valuedGain: gain, minGain: AI_EFFECT_WEIGHTS.MOVE_MIN_GAIN };
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.objectives = saved.obj; AI.player = saved.player; AI.missives = saved.miss; }
  });
})();
