(function() {
  var out = {};
  _withCleanBoard(function() {
    AI.player = 0;
    var scout = _place(createUnit('iron_imperium:speculatores', 0), 7, 18);
    scout.ap = 1;
    var rider = _place(createUnit('atashid_empire:aswaran', 1), 7, 6);
    G.battlePhase = 'MOVEMENT'; G.round = 1; G.activePlayer = 0;
    G.objectives = [{ id: 'obj0', col: 7, row: 11, holder: null }];
    AI._planRevision = (AI._planRevision || 0) + 1;
    _aiResetMoveEvalCache();
    var normalPick = { col: 7, row: 18 - getEffectiveMove(scout), score: 1 };
    out.move = getEffectiveMove(scout); out.range = _aiCachedEffectiveRange(scout);
    aiWithMoveEvalCache(function() {
      var dest = { col: 7, row: 11 };
      out.rolls = aiAdvanceRollSquares(scout, dest).map(function(r) { return r.chance.toFixed(3) + '@' + r.sq.col + ',' + r.sq.row; });
      out.expected = aiAdvanceExpectedScore(scout, dest);
      out.floor = _aiChargeFloorGround(scout, normalPick);
      out.forgone = aiForgoneActions(scout, 'advance', dest, normalPick);
      out.walkAction = _aiRoundActionAt(scout, scout, normalPick, false);
      out.worth = aiAdvanceWorth(scout, dest, normalPick);
    });
  });
  return out;
})()
