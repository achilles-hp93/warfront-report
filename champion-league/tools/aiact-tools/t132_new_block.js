// An ADVANCE costs every action it takes from the footprint this round, and the push goes
// only when the ground it gains is worth more than that (aiAdvanceWorth, ai/movement/
// advance_plan.js; the user's ruling, 2026-10-30: "a unit that only advance is a problem
// too. It lost out on shooting usually"). The Belfry Battery's guns advanced in Round 1
// with a shot to take and had no legal action (Champion League D1-M21); a squad that is
// no artillery is priced the same way. The ground is the real walk square's; the push's
// squares over its dice are stood in, at the walk's score plus `gain`.
(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'AI: the first-turn push goes only when its ground is worth more than the shots it gives up', fn: function() {
    return _withCleanBoard(function() {
      var saved = { player: AI.player, pick: _aiFirstTurnPushPick, expected: aiAdvanceExpectedScore };
      try {
        AI.player = 0;
        G.battlePhase = 'MOVEMENT'; G.round = 1; G.activePlayer = 0;
        G.objectives = [{ id: 'obj0', col: 7, row: 4, holder: null }];
        var gun = _place(createUnit('covenant_of_new_jerusalem:saint_barbara_field_gun', 0), 7, 13);
        if (!(aiUnitRoleWeight(gun, 'Artillery') > 0) || _aiMoveFirePenalty(gun) > 0) return 'fixture: the Field Gun is artillery that fires on the move';
        var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 9, Math.max(0, 13 - _aiCachedEffectiveRange(gun) - getEffectiveMove(gun)));
        var reset = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
        var read = function(fn) { reset(); return aiWithMoveEvalCache(fn); };
        // The push its own pick would make: two rows on, short of the objective's area.
        var short = { col: 7, row: 9 };
        _aiFirstTurnPushPick = function() { return { shouldAdvance: true, dest: short }; };
        var gain = 0;
        aiAdvanceExpectedScore = function(unit, dest) { return _aiChargeFloorGround(unit, walkOf(unit)) + gain; };
        var walks = {};
        var walkOf = function(unit) { return walks[unit.uid]; };
        var pushes = function(unit, walk, g) {
          walks[unit.uid] = walk; gain = g;
          return read(function() { return _aiEvalFirstTurnPush(unit, walk); });
        };
        var walk = { col: 7, row: 11, score: 1 };
        var lost = read(function() { return aiForgoneActions(gun, 'advance', short, walk); });
        if (!(lost >= aiW('MIN_ACTION_THRESHOLD'))) return 'fixture: the gun gives up a shot this round, got ' + lost;
        var w = aiW('W_CHARGE_COMBAT');
        if (pushes(gun, walk, w * lost * 0.5).shouldAdvance) return 'a push worth less than the shot it gives up: the gun walks and shoots';
        var push = pushes(gun, walk, w * lost * 2);
        if (!push.shouldAdvance) return 'a push worth more than the shot it gives up goes';
        var floor = read(function() { return _aiChargeFloorGround(gun, walk); });
        if (Math.abs(push.worth - (floor + w * lost * 2 - w * lost)) > 1e-6) return 'the push carries its price, the ground less the shot: ' + push.worth;
        // With nothing in reach this round, the push gives up nothing.
        var foeCol = foe.col;
        foe.col = -1;
        if (read(function() { return aiForgoneActions(gun, 'advance', short, walk); }) !== 0) return 'fixture: nothing in reach once the enemy is far';
        if (!pushes(gun, walk, 0.01).shouldAdvance) return 'with no shot to give up, any ground gained is worth the push';
        // A squad that is no artillery is priced the same way.
        var riders = _place(createUnit('iron_imperium:legionnaire_squad', 0), 3, 13);
        foe.col = foeCol;
        foe.row = Math.max(0, 13 - _aiCachedEffectiveRange(riders) - getEffectiveMove(riders));
        var riderWalk = { col: 3, row: 11, score: 1 };
        var riderLost = read(function() { return aiForgoneActions(riders, 'advance', short, riderWalk); });
        if (aiUnitRoleWeight(riders, 'Artillery') > 0 || !(riderLost >= aiW('MIN_ACTION_THRESHOLD'))) return 'fixture: a squad with a shot that is no artillery';
        if (pushes(riders, riderWalk, w * riderLost * 0.5).shouldAdvance) return 'a squad that is no artillery walks and shoots too, for a push worth less than its shot';
        if (!pushes(riders, riderWalk, w * riderLost * 2).shouldAdvance) return 'and pushes for one worth more';
        return true;
      } finally {
        AI.player = saved.player; _aiFirstTurnPushPick = saved.pick; aiAdvanceExpectedScore = saved.expected; _aiClearMoveEvalCache();
      }
    });
  }},
});

// A joined pair ADVANCES as one, and neither unit may act after it unless a rule lets it
// ("Advance, Fall Back and Charge count for both units"). The push is priced on every
// action it takes from the pair: the Aswaran act after an ADVANCE (Legacy of Rakhsh) and
// give up nothing, but the Spahbed's FREE Firebreath, with an enemy in its reach from the
// walk's square, cannot fire after it. Priced on the Aswaran alone, the push went and the
// Firebreath stayed unfired with Cultist Troopers 1 three squares off (Champion League
// D1-M01 R1; the user's ruling, 2026-10-30).
(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'AI: a pair\'s first-turn push is priced on its CHARACTER\'s shot from the walk\'s square', fn: function() {
    return _withCleanBoard(function() {
      var saved = { player: AI.player, pick: _aiFirstTurnPushPick, expected: aiAdvanceExpectedScore };
      try {
        AI.player = 0;
        G.battlePhase = 'MOVEMENT'; G.round = 1; G.activePlayer = 0;
        G.objectives = [{ id: 'obj0', col: 3, row: 2, holder: null }];
        var squad = _place(createUnit('atashid_empire:aswaran', 0), 3, 13);
        _place(createUnit('infernal_congregations:cultists', 1), 6, 9);
        var reset = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
        var read = function(fn) { reset(); return aiWithMoveEvalCache(fn); };
        var walk = { col: 3, row: 10, score: 1 };
        var dest = { col: 3, row: 8 };
        _aiFirstTurnPushPick = function() { return { shouldAdvance: true, dest: dest }; };
        var gain = 0;
        aiAdvanceExpectedScore = function(unit) { return _aiChargeFloorGround(unit, walk) + gain; };
        var lostBy = function() { return read(function() { return aiForgoneActions(squad, 'advance', dest, walk); }); };
        var alone = lostBy();
        var spahbed = createUnit('atashid_empire:spahbed', 0);
        G.units.push(spahbed);
        var att = attachLeader(spahbed, squad, { ignoreAdjacency: true, ignoreMoved: true });
        if (!att || !att.ok) return 'fixture: the Spahbed leads the Aswaran: ' + (att && att.reason);
        // The rules leave the Spahbed nothing after the ADVANCE, and its Firebreath from the
        // walk's square is its action this round.
        var fromWalk = read(function() { return _aiRoundActionAt(squad, spahbed, walk, false); });
        if (!(fromWalk >= aiW('MIN_ACTION_THRESHOLD'))) return 'fixture: the Spahbed has a shot from the walk\'s square, got ' + fromWalk;
        if (read(function() { return _aiRoundActionAt(squad, spahbed, dest, true); }) !== 0) return 'after the ADVANCE the Spahbed may not act';
        var paired = lostBy();
        if (!(paired >= alone + fromWalk - 1e-9)) return 'the push gives up the Spahbed\'s action as well as the Aswaran\'s: ' + paired + ' vs ' + alone + ' + ' + fromWalk;
        var w = aiW('W_CHARGE_COMBAT');
        // Ground worth more than the Aswaran's loss and less than the pair's.
        gain = w * (alone + paired) / 2;
        if (read(function() { return _aiEvalFirstTurnPush(squad, walk); }).shouldAdvance) return 'the pair walks: its push is worth less than the Spahbed\'s Firebreath';
        var off = detachLeader(spahbed);
        if (!off || !off.ok) return 'fixture: the Spahbed detaches: ' + (off && off.reason);
        removeFromBoard(spahbed);
        if (!read(function() { return _aiEvalFirstTurnPush(squad, walk); }).shouldAdvance) return 'the Aswaran alone push for the same ground: they give up ' + alone;
        return true;
      } finally {
        AI.player = saved.player; _aiFirstTurnPushPick = saved.pick; aiAdvanceExpectedScore = saved.expected; _aiClearMoveEvalCache();
      }
    });
  }},
});
