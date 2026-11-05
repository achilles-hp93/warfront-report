(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'zz explore sac', fn: function() {
    var out = [];
    _withCleanBoard(function() {
      G.round = 2;
      G.battlePhase = 'COMMAND'; var hq = _gaiSetup('avalanche_of_contempt');
      var cultists = _place(createUnit('infernal_congregations:cultists', 0), 3, 3);
      var demon = _place(createUnit('infernal_congregations:avatar_of_wrath', 0), 4, 3);
      _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 3);
      var cmd = hq.commands.find(function(c) { return c.name === 'Unholy Sacrifice'; });
      out.push('phase=' + G.battlePhase + ' pairRequires=' + JSON.stringify(cmd.pairRequires));
      aiWithMoveEvalCache(function() {
        var ctx = { player: 0, cmd: cmd, friendlies: _aiCommandFriendlies(0), enemies: _aiCommandEnemies(0) };
        var pair = { sacrifice: cultists, demon: demon };
        cmd.effects.forEach(function(e) {
          var t = _aiGenericEffectTargets(cmd, e, pair);
          out.push(e.op + ' -> ' + (t && t.name) + ' = ' + aiCommandEffectValue(e, t, ctx));
        });
        out.push('weight ' + _aiGenericCommandWeight(0, cmd, pair, ctx));
        out.push('melee chance ' + aiUnitAttackChance(demon, 'melee', {}) + ' ranged ' + aiUnitAttackChance(demon, 'ranged', {}));
        out.push('cheapest ' + JSON.stringify(_aiCommandCheapestIssue(0, cmd, pair) && _aiCommandCheapestIssue(0, cmd, pair).preview.cpCost));
      });
    });
    return out.join('\n');
  } },
});
