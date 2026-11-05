(function() {
  var out = {};
  _jadeWithBoard(function() {
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; AI.player = 0; AI.formationReadings = null;
    var units = _jadePlaceFormation('black_tortoise', 0, 5, 5);
    var vanguard = _place(createUnit('jade_mandate:terracotta_vanguard', 0), 4, 5);
    vanguard.faction = 'jade_mandate';
    var mover = units[2]; mover.moved = true;
    var away = { col: mover.col + 6, row: mover.row };
    AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
    out.inReach = _aiCachedReachableSquares(mover).some(function(sq) { return sq.col === away.col && sq.row === away.row; });
    out.termBefore = _aiFormationTerm(mover, away.col, away.row);
    _aiClearMoveEvalCache();
    AI._planRevision++; _aiResetMoveEvalCache();
    aiChooseDestination(mover, [away], { granted: true });
    out.term = _aiFormationTerm(mover, away.col, away.row);
    out.next = _aiFormationAssignmentAt(mover, away.col, away.row);
    _aiClearMoveEvalCache();
  });
  return out;
})()
