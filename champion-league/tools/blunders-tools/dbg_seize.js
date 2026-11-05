(function() {
  return _withCleanBoard(function() {
    G.round = 2; G.seizedControl = [];
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION';
    var queen = _place(createUnit('iron_imperium:legionnaire_squad', 0), 2, 2);
    var friend = _place(createUnit('iron_imperium:legionnaire_squad', 0), 3, 3);
    var near = _place(createUnit('iron_imperium:legionnaire_squad', 1), 6, 6);
    [queen, friend, near].forEach(function(u) { u.intelLevel = [1, 1]; });
    near.ap = 1;
    _aiResetMoveEvalCache();
    var out = {
      worth: aiUnitAttackWorth(near),
      targets: aiAttackTargets(0).map(function(u) { return u.name; }),
      plan: (function() { var p = _aiPickBestCompositionAttack(near, friend); return p && { score: p.score }; })(),
      canMelee: canMeleeAttack(near, friend, Weapons.groups(near, 'melee')[0].weapon),
      active: G.activePlayer,
    };
    G.activePlayer = 1;
    _aiResetMoveEvalCache();
    out.worthActive1 = aiUnitAttackWorth(near);
    _aiClearMoveEvalCache();
    return out;
  });
})();
