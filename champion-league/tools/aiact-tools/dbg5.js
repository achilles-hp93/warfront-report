(function() {
  var res = {};
  _pmBoard(function() {
    AI.player = 0; G.round = 1; G.battlePhase = 'COMMAND';
    var squad = _pmSquad(0, 7, 12);
    AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
    res.abilities = (squad.abilities || []).map(function(a) { return a.name + ':' + a.phase; });
    aiWithMoveEvalCache(function() {
      withFootprintAt(squad, 7, 9, function() {
        return withFootprintMoved(squad, function() {
          var best = aiUnitBestAction(squad);
          res.best = best && { type: best.type, ab: best.ability && best.ability.name, tgt: best.target && (best.target.name || JSON.stringify(best.target)), score: best.score };
        });
      });
    });
  });
  return res;
})()
