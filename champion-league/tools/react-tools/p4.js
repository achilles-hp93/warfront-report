(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'PROBE4', fn: function() {
    var out = [];
    _withCleanBoard(function() {
      var savedScore = aiScoreDestination;
      var saved = { player: AI.player, orders: G.pendingMoveOrders, plan: AI.moveOrderPlan };
      try {
        AI.player = 1;
        G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.pendingMoveOrders = null; G.activePlayer = 1; G.objectives = [];
        var rot = _place(createUnit('polish_lithuanian_ruthenian_commonwealth:rotmistrz', 1), 6, 6);
        var hussars = _place(createUnit('polish_lithuanian_ruthenian_commonwealth:consecrated_hussars', 1), 7, 6);
        var foe = _place(createUnit('iron_imperium:legionnaire_squad', 0), 11, 6);
        [rot, hussars, foe].forEach(function(u) { u.intelLevel = [1, 1]; });
        hussars.moved = true;
        var sabre = (rot.abilities || []).filter(function(a) { return (a.abilityId || a.id) === 'sabre_signal'; })[0];
        out.push('sabre ' + !!sabre + ' rot tags ' + JSON.stringify(rot.tags));
        var move = aiImmediateMoveEffect(_findAbility(rot, sabre.name).effects);
        out.push('move ' + JSON.stringify(move));
        out.push('squares ' + immediateMoveSquares(hussars, move).map(function(s) { return s.col + ',' + s.row + ':' + s.cost; }).join(' '));
        aiScoreDestination = function() { return 1; };
        var worth = aiCommandEffectValue(move, hussars, { player: 1 });
        out.push('worth ' + worth + ' score ' + _aiScoreAbility(rot, sabre, hussars));
        out.push('plan ' + JSON.stringify(aiAbilityMovePlan(rot, sabre, hussars)));
        var chosen = aiChooseActionPhase(1).best;
        out.push('chosen ' + (chosen && chosen.type) + ' ' + (chosen && chosen.ability && chosen.ability.name) + ' plan ' + JSON.stringify(AI.moveOrderPlan));
        runOp(move, { unit: rot, targets: [hussars], source: 'probe' });
        out.push('next ' + JSON.stringify(aiNextMoveOrder()));
      } catch (e) { out.push('ERR ' + e.stack); } finally {
        aiScoreDestination = savedScore; AI.player = saved.player; G.pendingMoveOrders = saved.orders; AI.moveOrderPlan = saved.plan;
      }
    });
    return out.join('\n');
  }},
});
