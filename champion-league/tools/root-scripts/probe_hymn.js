(function() {
  var restore = _cpsArmyProbe([
    { op: 'command_phase_select', scope: 'army', id: 'probe_pick', picks: 2,
      select: { side: 'friendly', range: 'battlefield' },
      choices: [ { id: 'sharp', name: 'Sharp' }, { id: 'dull', name: 'Dull' } ] },
    { op: 'conditional_weapon_stat', stat: 'AP', amount: 1, target: 'self', source: 'Probe Sharp',
      when: { predicate: 'command_selected', select: 'probe_pick', choice: 'sharp' } },
  ]);
  return _withCleanBoard(function() {
    try {
      G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.activePlayer = 0; G.round = 4;
      G.formations = [{ factionId: 'iron_imperium', subfactionId: 'probe_army_sub', units: [] },
                      { factionId: 'iron_imperium', subfactionId: null, units: [] }];
      if (G.players) G.players.forEach(function(p, i) { if (p) p.subfactionId = i === 0 ? 'probe_army_sub' : null; });
      var a = _place(createUnit('iron_imperium:legionnaire_squad', 0), 3, 3);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 3, 8);
      [a, foe].forEach(function(u) { u.intelLevel = [1, 1]; u.ap = 1; });
      var def = armyPickDef('probe_pick');
      var apOf = function() { var w = Weapons.first(a, 'ranged'); return Weapons.profile(a, Models.all(a)[0], w, { preview: true }).ap; };
      var out = { sub: unitSubfactionId(a), chance: aiUnitAttackChance(a, 'any'), worth: aiWithMoveEvalCache(function() { return aiUnitAttackWorth(a); }),
        ap: apOf(), apPicked: withArmyPick(def, a, 'sharp', apOf),
        worthPicked: aiWithMoveEvalCache(function() { return _aiWithScratchMoveEvalCache(function() { return withArmyPick(def, a, 'sharp', function() { return aiUnitAttackWorth(a); }); }); }),
        targets: aiAttackTargets(1).map(function(u) { return u.name; }),
        choiceWorth: aiArmyPickChoiceWorth(def, a, 'sharp') };
      G.battlePhase = 'ACTION';
      out.chanceAction = aiUnitAttackChance(a, 'any');
      return out;
    } finally { restore(); }
  });
})();
