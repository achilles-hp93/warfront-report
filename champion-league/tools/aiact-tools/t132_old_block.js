// An ADVANCE short of every objective only gains ground and costs the round's actions:
// artillery with a shot this round walks and shoots instead. The Belfry Battery's guns
// advanced in Round 1 and had no legal action (Champion League D1-M21). Other shooters
// push: they take the objectives.
(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'AI: the first-turn push short of an objective gives way to artillery\'s shot this round', fn: function() {
    return _withCleanBoard(function() {
      var saved = { player: AI.player, pick: _aiFirstTurnPushPick };
      try {
        AI.player = 0;
        G.battlePhase = 'MOVEMENT'; G.round = 1; G.activePlayer = 0;
        G.objectives = [{ id: 'obj0', col: 7, row: 4, holder: null }];
        var squad = _place(createUnit('covenant_of_new_jerusalem:saint_barbara_field_gun', 0), 7, 13);
        squad.ap = 1;
        if (!(aiUnitRoleWeight(squad, 'Artillery') > 0) || _aiMoveFirePenalty(squad) > 0) return 'fixture: the Field Gun is artillery that fires on the move';
        var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 9, Math.max(0, 13 - _aiCachedEffectiveRange(squad) - getEffectiveMove(squad)));
        var reset = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
        // The push its own pick would make: two rows on, short of the objective's area.
        var short = { col: 7, row: 9 };
        _aiFirstTurnPushPick = function() { return { shouldAdvance: true, dest: short }; };
        reset();
        if (!(aiChargeForgoneShot(squad) >= aiW('MIN_ACTION_THRESHOLD'))) return 'fixture: the squad has a shot this round';
        if (_aiEvalFirstTurnPush(squad, { col: 7, row: 11, score: 1 }).shouldAdvance) return 'with a shot this round, it walks and shoots rather than push short';
        // A push into the objective's area is taken all the same.
        _aiFirstTurnPushPick = function() { return { shouldAdvance: true, dest: { col: 7, row: 5 } }; };
        reset();
        if (!_aiEvalFirstTurnPush(squad, { col: 7, row: 11, score: 1 }).shouldAdvance) return 'a push onto an objective is worth the shot';
        // With nothing in reach this round, the push short of it goes ahead.
        _aiFirstTurnPushPick = function() { return { shouldAdvance: true, dest: short }; };
        var foeCol = foe.col;
        foe.col = -1;
        reset();
        if (aiChargeForgoneShot(squad) >= aiW('MIN_ACTION_THRESHOLD')) return 'fixture: nothing in reach once the enemy is far';
        if (!_aiEvalFirstTurnPush(squad, { col: 7, row: 11, score: 1 }).shouldAdvance) return 'with no shot to give up, the push goes ahead';
        // A shooter that is no artillery pushes with its shot in reach.
        var riders = _place(createUnit('iron_imperium:legionnaire_squad', 0), 3, 13);
        foe.col = foeCol;
        foe.row = Math.max(0, 13 - _aiCachedEffectiveRange(riders) - getEffectiveMove(riders));
        reset();
        if (aiUnitRoleWeight(riders, 'Artillery') > 0 || !(aiChargeForgoneShot(riders) >= aiW('MIN_ACTION_THRESHOLD'))) return 'fixture: a squad with a shot that is no artillery';
        if (!_aiEvalFirstTurnPush(riders, { col: 3, row: 11, score: 1 }).shouldAdvance) return 'a squad that is no artillery takes its push';
        return true;
      } finally {
        AI.player = saved.player; _aiFirstTurnPushPick = saved.pick; _aiClearMoveEvalCache();
      }
    });
  }},
});
