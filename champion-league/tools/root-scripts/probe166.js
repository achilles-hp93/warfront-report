(function() {
  return _withCleanBoard(function() {
    var saved = AI.player;
    try {
      setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === 'CROSSROADS'; })[0]);
      G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.round = 2; G.activePlayer = 0; G.objectives = [];
      AI.player = 0;
      var rifles = _place(createUnit('iron_imperium:legionnaire_squad', 0), 4, 12);
      var own = getMovementPoints(rifles);
      G.objectives = [{ col: 4, row: 12 - own - 2 - 1, vp: 3 }];
      _aiResetMoveEvalCache();
      return aiWithMoveEvalCache(function() {
        var adv = _aiCanAdvance(rifles) && _aiEvalAdvance(rifles).shouldAdvance;
        var advMove = adv ? getAdvanceMovementPoints(rifles, advanceExpectedSuccesses(rifles)) : 0;
        var reach = function(extra) { var sq = reachableSquares(rifles, extra); return adv ? sq.concat(reachableSquares(rifles, 0, { mode: 'advance', maxMove: advMove + extra })) : sq; };
        var p2 = aiChooseDestination(rifles, reach(2), { greedy: true }), p0 = aiChooseDestination(rifles, reach(0), { greedy: true });
        var gb = _aiCachedGlobalBest(rifles);
        return { own: own, obj: G.objectives[0], adv: adv, advMove: advMove, p2: p2 && [p2.col, p2.row, p2.toward && [p2.toward.col, p2.toward.row]], p0: p0 && [p0.col, p0.row],
          s2: p2 && aiScoreDestination(rifles, p2), s0: p0 && aiScoreDestination(rifles, p0), stay: aiScoreDestination(rifles, { col: 4, row: 12 }),
          global: gb && [gb.col, gb.row, gb.turnsAway, gb.score], missive: aiGetMissive(rifles).type, plan: aiExtraMovePlan(rifles, 2).gain };
      });
    } finally { AI.player = saved; }
  });
})();
