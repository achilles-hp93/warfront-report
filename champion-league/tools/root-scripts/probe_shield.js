(function() {
  var restore = _cpsArmyProbe([
    { op: 'command_phase_select', scope: 'army', id: 'probe_pick', picks: 2,
      select: { side: 'friendly', range: 'battlefield' },
      choices: [{ id: 'dull', name: 'Dull' }, { id: 'shield', name: 'Shield' }] },
    { op: 'conditional_mod', stat: 'incoming_ap', amount: -1, target: 'self', source: 'Probe Shield',
      when: { predicate: 'command_selected', select: 'probe_pick', choice: 'shield' } },
  ]);
  return _withCleanBoard(function() {
    try {
      G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.activePlayer = 0; G.round = 5;
      G.formations = [{ factionId: 'iron_imperium', subfactionId: 'probe_army_sub', units: [] },
                      { factionId: 'iron_imperium', subfactionId: null, units: [] }];
      if (G.players) G.players.forEach(function(p, i) { if (p) p.subfactionId = i === 0 ? 'probe_army_sub' : null; });
      var c = _place(createUnit('iron_imperium:legionnaire_squad', 0), 7, 3);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 8, 4);
      [c, foe].forEach(function(u) { u.intelLevel = [1, 1]; u.ap = 1; });
      var def = armyPickDef('probe_pick');
      var taken = function() { return aiWithMoveEvalCache(function() { return aiRoundAttack(foe, c).taken; }); };
      var w = Weapons.first(foe, 'ranged');
      var est = function() { return expectedGroupsCasualties(foe, c, Weapons.groups(foe, 'ranged'), 'ranged'); };
      return { chance: aiUnitAttackChance(foe, 'any'), taken: taken(),
        takenPicked: withArmyPick(def, c, 'shield', function() { return _aiWithScratchMoveEvalCache(taken); }),
        est: est(), estPicked: withArmyPick(def, c, 'shield', function() { return rulesReadingAside(est); }),
        sel: withArmyPick(def, c, 'shield', function() { return unitCommandSelected(c, 'probe_pick', 'shield'); }),
        incoming: withArmyPick(def, c, 'shield', function() { return typeof sumConditionalMods === 'function' ? sumConditionalMods(c, 'incoming_ap') : 'n/a'; }),
        worth: aiArmyPickChoiceWorth(def, c, 'shield') };
    } finally { restore(); }
  });
})();
