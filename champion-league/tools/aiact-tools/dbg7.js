(function() {
  var out = {};
  _withCleanBoard(function() {
    AI.player = 0;
    G.battlePhase = 'MOVEMENT'; G.round = 1; G.activePlayer = 0;
    G.objectives = [{ id: 'obj0', col: 7, row: 4, holder: null }];
    var gun = _place(createUnit('covenant_of_new_jerusalem:saint_barbara_field_gun', 0), 7, 13);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 5, 8);
    AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
    aiWithMoveEvalCache(function() {
      out.per = getEffectivePER(gun);
      out.sight = _aiEnemiesInSightThisRound(0)[foe.uid];
      out.hpHere = aiExpectedRangedDamage(gun, foe);
      out.groups = _aiGroupsAgainst(gun, foe, 'ranged').length;
      out.means = attackerMeansBlockReason(gun);
      out.shotHere = _aiBestShotThisRound(gun);
      out.atWalk = withFootprintAt(gun, 7, 11, function() { return withFootprintMoved(gun, function() {
        return _aiWithScratchMoveEvalCache(function() {
          return { sight: _aiEnemiesInSightThisRound(0)[foe.uid], means: attackerMeansBlockReason(gun), shot: _aiBestShotThisRound(gun, true), groups: _aiGroupsAgainst(gun, foe, 'ranged').length,
            runtime: Weapons.groups(gun, 'ranged').map(function(g) { return weaponRuntimeBlockReason(gun, g.weapon); }) };
        });
      }); });
    });
  });
  return out;
})()
