(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'PROBE1', fn: function() {
    return _withCleanBoard(function() {
      var saved = { player: AI.player };
      var out = [];
      try {
        AI.player = 0;
        G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 2; G.activePlayer = 0; G.objectives = [];
        var charger = _place(createUnit('iron_imperium:legionnaire_squad', 0), 7, 12);
        var levies = _place(createUnit('iron_imperium:praetorian_gunners', 1), 7, 10);
        var guns = levies;
        [charger, levies, guns].forEach(function(u) { u.intelLevel = [1, 1]; });
        var land = getChargeReachableSquares(charger).find(function(s) { return s.col === 7 && s.row === 11; });
        out.push('land ' + JSON.stringify(land && [land.col, land.row, land.cost]));
        var priced = function() {
          _aiResetMoveEvalCache();
          try { return { s: _aiScoreChargeSquare(charger, land), r: aiChargeReactions(charger, land) }; } finally { _aiClearMoveEvalCache(); }
        };
        markRound(guns, 'overwatch_used');
        var spent = priced();
        out.push('spent ' + spent.s.score + ' ' + JSON.stringify(spent.r));
        clearRoundMark(guns, 'overwatch_used'); markRound(guns, 'overwatch_ready');
        out.push('canOverwatch ' + canOverwatch(guns));
        var ready = priced();
        out.push('ready ' + ready.s.score + ' ' + JSON.stringify(ready.r));
        var hits = withFootprintAt(charger, land.col, land.row, function() {
          var atk = getOverwatchAttacks(guns, charger);
          var opts = aiOverwatchAttackOptions(guns, charger, atk);
          var o2 = { naturalHitThreshold: overwatchHitThreshold(guns, charger), attackOrigin: 'overwatch' };
          aiRangedAttackChoiceValues(guns, charger, atk, o2).forEach(function(v) {
            out.push('raw expected ' + v.expected + ' weapons ' + v.choice.weapons.map(function(w){return w.name||w.id;}).join('+') + ' stray ' + JSON.stringify(aiStrayShot(guns, charger, v.choice.weapons[0])) + ' kept ' + aiOverwatchFreeUseCost(guns, charger, v.choice));
          });
          out.push('attacks ' + atk.length + ' opts ' + JSON.stringify(opts.map(function(o) { return [o.score, o.hits]; })));
          var chance = aiSoftmaxProbabilities(opts, AI_WEIGHTS.TEMPERATURE);
          return opts.reduce(function(t, o, i) { return t + chance[i] * o.hits; }, 0);
        });
        out.push('hits ' + hits);
        return out.join('\n');
      } finally {
        AI.player = saved.player;
      }
    });
  }},
});
