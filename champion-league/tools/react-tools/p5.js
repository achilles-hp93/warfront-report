(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'PROBE5', fn: function() {
    var out = [];
    _withCleanBoard(function() {
      var saved = { player: AI.player, score: aiScoreDestination };
      try {
        AI.player = 0;
        G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.activePlayer = 0; G.round = 2; G.objectives = [];
        G.pendingRepositions = []; G.pendingMoveOrders = null; G.pendingInterjection = null;
        var LEG = 'iron_imperium:legionnaire_squad';
        var mk = function(p, c, r) { var u = _place(createUnit(LEG, p), c, r); u.ap = 1; u.usedAction = false; u.attacked = false; u.moved = false; return u; };
        var cmd = mk(0, 1, 2), h = mk(0, 1, 1), foe = mk(1, 6, 1);
        markRound(foe, 'overwatch_used');
        h.moved = true; h.ap = 0;
        var reserve = mk(1, 4, 5); reserve.ap = 0;
        var hq = _place(createUnit('hq', 1, true), 8, 5); hq.isHQ = true;
        G.players[1].commandsUsedThisPhase = [];
        aiScoreDestination = function() { return 0; };
        var sabre = { op: 'grant_move', mode: 'immediate', as_charge: true, reason: 'PROBE SABRE' };
        out.push('squares ' + immediateMoveSquares(h, sabre).map(function(s) { return s.col + ',' + s.row + ':' + s.cost; }).join(' '));
        [0, 5].forEach(function(cp) {
          G.players[1].cp = cp;
          var v = aiCommandEffectValue(sabre, h, { player: 0 });
          var plan = _aiCommandRepositionPlan(h, sabre);
          _aiResetMoveEvalCache();
          var r = null, all = [];
          try {
            r = plan && aiChargeReactions(h, plan.dest);
            immediateMoveSquares(h, sabre).forEach(function(s) {
              var sc = _aiScoreChargeSquare(h, s, 0);
              all.push(s.col + ',' + s.row + '=' + (sc && sc.score.toFixed(2)) + (aiChargeReactions(h, s).countercharge ? 'cc' : ''));
            });
          } finally { _aiClearMoveEvalCache(); }
          out.push('cp' + cp + ' value ' + v + ' plan ' + JSON.stringify(plan) + ' cc ' + JSON.stringify(r && r.countercharge) + ' | ' + all.join(' '));
        });
      } catch (e) { out.push('ERR ' + e.stack); } finally { AI.player = saved.player; aiScoreDestination = saved.score; }
    });
    return out.join('\n');
  }},
});
