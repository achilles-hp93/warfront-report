(function() {
  var res = [];
  [[11, 5], [12, 4], [13, 2], [13, 1], [1, 1], null].forEach(function(pos) {
    _pmBoard(function() {
      var out = { foe: pos };
      var fresh = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
      AI.player = 0; G.round = 1; G.battlePhase = 'COMMAND';
      var squad = _pmSquad(0, 7, 12);
      if (pos) { var foe = _pmSquad(1, pos[0], pos[1]); foe.moved = true; }
      fresh();
      aiWithMoveEvalCache(function() {
        var choice = aiUnitMoveChoice(squad, { priced: true });
        out.choice = choice && [choice.type, choice.dest.col, choice.dest.row, choice.worth];
        var adv = _aiEvalAdvance(squad);
        out.adv = adv.shouldAdvance ? [adv.dest.col, adv.dest.row, adv.worth] : false;
        var walk = _aiExtraMoveWalk(squad, 2);
        out.walked = walk.with - walk.without;
      });
      res.push(out);
    });
  });
  return res;
})()
