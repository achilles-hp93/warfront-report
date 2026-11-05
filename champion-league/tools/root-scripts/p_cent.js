(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { phase: G.battlePhase, round: G.round, active: G.activePlayer };
    try {
      G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 0; G.objectives = [];
      var monk = _place(createUnit('church_of_the_beast:beast_monk', 0), 2, 2);
      var centaur = _place(createUnit('church_of_the_beast:marrowstring_centaur', 0), 9, 9);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 9, 5);
      [monk, centaur].forEach(function(u) { u.ap = 1; u.moved = false; });
      AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
      out.unspotted = aiUnitAttackChance(centaur, 'ranged', { actor: monk });
      foe.intelLevel = [1, 1];
      AI._planRevision++; _aiResetMoveEvalCache();
      out.spotted = aiUnitAttackChance(centaur, 'ranged', { actor: monk });
      out.range = _aiCachedEffectiveRange(centaur);
    } finally { G.battlePhase = saved.phase; G.round = saved.round; G.activePlayer = saved.active; }
  });
  return out;
})()
