(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'PROBE2', fn: function() {
    return _withCleanBoard(function() {
      var saved = { player: AI.player, score: aiScoreDestination };
      var out = [];
      try {
        AI.player = 0;
        G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 1; G.objectives = [];
        G.pendingRepositions = []; G.pendingMoveOrders = null; G.pendingInterjection = null;
        var LEG = 'iron_imperium:legionnaire_squad';
        var c = _place(createUnit(LEG, 0), 5, 5);
        var t = _place(createUnit(LEG, 1), 5, 8);
        var x = _place(createUnit(LEG, 1), 7, 8);
        var hq = _place(createUnit('hq', 1, true), 10, 8); hq.isHQ = true;
        [c, t, x].forEach(function(u) { u.intelLevel = [1, 1]; u.moved = false; });
        G.players[1].commandsUsedThisPhase = []; G.players[0].commandsUsedThisPhase = [];
        aiScoreDestination = function() { return 0; };
        runOp({ op: 'grant_move', compulsory: true, toward: 'closest_enemy', as_charge: true, fraction: 1, reason: 'PROBE RAGE' }, { unit: c, targets: [c], source: 'probe' });
        var entry = pendingRepositionFor(c);
        var squares = repositionCandidates(c, entry);
        out.push('squares ' + squares.map(function(s) { return s.col + ',' + s.row + ':' + s.cost; }).join(' '));
        [0, 5].forEach(function(cp) {
          G.players[1].cp = cp;
          _aiResetMoveEvalCache();
          try {
            squares.forEach(function(s) {
              var sc = _aiScoreChargeSquare(c, s, null, { sure: true });
              var r = aiChargeReactions(c, s, { sure: true });
              out.push('cp' + cp + ' ' + s.col + ',' + s.row + ' score ' + (sc && sc.score.toFixed(2)) + ' cc ' + JSON.stringify(r.countercharge));
            });
          } finally { _aiClearMoveEvalCache(); }
          var pick = aiRepositionSquare(c, squares, entry);
          out.push('cp' + cp + ' pick ' + JSON.stringify(pick && [pick.col, pick.row, pick.score]));
        });
        return out.join('\n');
      } finally {
        AI.player = saved.player; aiScoreDestination = saved.score;
      }
    });
  }},
});
