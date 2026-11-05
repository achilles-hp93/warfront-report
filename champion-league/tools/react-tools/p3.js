(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'PROBE3', fn: function() {
    var out = [];
    // Countercharge worth with an Overwatch-Ready unit on the charger's side.
    _withCleanBoard(function() {
      G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.activePlayer = 0; G.round = 2; G.objectives = [];
      G.players[0].cp = 0; G.players[1].cp = 5;
      G.players[0].commandsUsedThisPhase = []; G.players[1].commandsUsedThisPhase = [];
      var levies = _place(createUnit('iron_imperium:praetorian_gunners', 0), 5, 3);
      var line = _place(createUnit('covenant_of_new_jerusalem:covenant_levies', 1), 5, 4);
      var paladins = _place(createUnit('covenant_of_new_jerusalem:golgothic_paladins', 1), 9, 3);
      var guns = levies;
      [levies, line, paladins, guns].forEach(function(u) { u.intelLevel = [1, 1]; });
      var sq = { col: 6, row: 3, cost: 3 };
      var worth = function() { _aiResetMoveEvalCache(); try { return { w: aiCounterchargeWorth(paladins, levies, [line], sq, 1), own: aiCounterchargeOwn(paladins, levies, sq) }; } finally { _aiClearMoveEvalCache(); } };
      var a = worth();
      markRound(guns, 'overwatch_ready');
      var b = worth();
      out.push('cc worth spent ' + a.w + ' ready ' + b.w + ' r ' + JSON.stringify(b.own.reactions) + ' fight ' + b.own.fight);
    });
    // Sabre Signal value with and without a countercharge.
    _withCleanBoard(function() {
      var saved = { player: AI.player };
      try {
        AI.player = 0;
        G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.activePlayer = 0; G.round = 2; G.objectives = [];
        G.pendingRepositions = []; G.pendingMoveOrders = null; G.pendingInterjection = null;
        var LEG = 'iron_imperium:legionnaire_squad';
        var mk = function(p, c, r) { var u = _place(createUnit(LEG, p), c, r); u.ap = 1; u.moved = false; u.intelLevel = [1, 1]; return u; };
        var cmd = mk(0, 1, 2), h = mk(0, 1, 1), foe = mk(1, 6, 1);
        h.moved = true;
        markRound(foe, 'overwatch_used');
        var reserve = mk(1, 5, 5);
        var hq = _place(createUnit('hq', 1, true), 9, 5); hq.isHQ = true;
        G.players[1].commandsUsedThisPhase = [];
        var sabre = { op: 'grant_move', mode: 'immediate', as_charge: true, reason: 'PROBE SABRE' };
        out.push('squares ' + immediateMoveSquares(h, sabre).map(function(s) { return s.col + ',' + s.row + ':' + s.cost; }).join(' '));
        [0, 5].forEach(function(cp) {
          G.players[1].cp = cp;
          var v = aiCommandEffectValue(sabre, h, { player: 0 });
          var plan = _aiCommandRepositionPlan(h, sabre);
          _aiResetMoveEvalCache();
          var r = null;
          try { r = plan && aiChargeReactions(h, plan.dest); } finally { _aiClearMoveEvalCache(); }
          out.push('cp' + cp + ' value ' + v + ' plan ' + JSON.stringify(plan) + ' cc ' + JSON.stringify(r && r.countercharge));
        });
      } finally { AI.player = saved.player; }
    });
    return out.join('\n');
  }},
});
