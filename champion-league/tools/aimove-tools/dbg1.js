(function() {
  var out = {};
  _jadeWithBoard(function() {
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; AI.player = 0; AI.formationReadings = null;
    var units = _jadePlaceFormation('black_tortoise', 0, 5, 5);
    var vanguard = _place(createUnit('jade_mandate:terracotta_vanguard', 0), 4, 5);
    vanguard.faction = 'jade_mandate';
    var mover = units[2];
    mover.moved = true;
    var away = { col: mover.col + 1, row: mover.row + 2 };
    AI._planRevision = (AI._planRevision || 0) + 1;
    _aiResetMoveEvalCache();
    out.cacheBefore = !!_aiMoveEvalCache();
    out.view = !!_aiFormationView(0);
    aiChooseDestination(mover, [away], { granted: true });
    out.cacheAfter = !!_aiMoveEvalCache();
    out.reach = Object.keys(_aiFormationReach(mover));
    out.formOf = _aiFormationView(0).formOf;
    out.next = _aiFormationAssignmentAt(mover, away.col, away.row);
    out.term = _aiFormationTerm(mover, away.col, away.row);
    out.leads = _aiFormationView(0).leads.map(function(u) { return u.uid; });
    out.mover = mover.uid;
    _aiClearMoveEvalCache();
  });
  return out;
})()
