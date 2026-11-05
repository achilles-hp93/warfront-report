'use strict';

// Whether an enemy can CHARGE is the rule's question (canDeclareCharge,
// core/movement/charge.js), and the AI asks it rather than keeping its own copy. The
// copy in _aiChargeBase had drifted: it never asked a unit's MOVE, so an HQ (MOVE 0,
// which the rule refuses a CHARGE) read as a charge threat beside it. The mine's
// reading of the next round (ai/action/mine_value.js) asked no declaration rule at all,
// so an ENGAGED enemy, which cannot charge, still read as landing charges. And the rule
// holds the active player's other units back only while one is activated: read during
// that activation, they could not charge this Movement Phase at all, and a side weighing
// a Countercharge in the middle of the charger's activation counted none of the
// charger's friends that could reach its countercharger (D1-M16 R2).

(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'PROBE AI: only a unit the rule lets CHARGE reads as a charge threat, an activation in progress holding none back past its end', fn: function() {
    if (typeof _aiChargeReachChance !== 'function') return '_aiChargeReachChance missing';
    return _withCleanBoard(function() {
      var saved = AI.player;
      var savedActivation = G.unitActivation;
      try {
        setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === 'TRIPLE HILLS'; })[0]);
        G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 2; G.activePlayer = 0; G.objectives = [];
        AI.player = 0;
        var squad = _place(createUnit('iron_imperium:legionnaire_squad', 0), 7, 9);
        var hq = _place(createUnit('hq', 1, true), 7, 7);
        var knights = _place(createUnit('covenant_of_new_jerusalem:knight_apostle', 1), 3, 5);
        var holder = _place(createUnit('iron_imperium:legionnaire_squad', 0), 3, 6);
        _aiResetMoveEvalCache();
        if (canDeclareCharge(hq).ok) return 'fixture: the rule refuses a MOVE 0 unit a CHARGE';
        if (_aiChargeReachChance(hq, squad, 7, 8) !== 0) return 'an HQ beside the square is no charge threat';
        // ENGAGED by the holder, the Knight-Apostles cannot charge next round either.
        if (Object.keys(_aiEnemyNextReach(knights).charge).length) return 'an ENGAGED enemy lands no charge next round';
        holder.alive = false; holder.col = -1;
        _aiResetMoveEvalCache();
        if (!Object.keys(_aiEnemyNextReach(knights).charge).length) return 'free, the Knight-Apostles can land a charge beside the squad';
        // Another of their side's units activated holds them only until its activation
        // ends: they may still CHARGE this Movement Phase (Champion League D1-M16 R2, a
        // Countercharge weighed in the middle of the charger's activation).
        _aiResetMoveEvalCache();
        var free = _aiChargeReachChance(knights, squad, 4, 7);
        if (!(free > 0)) return 'fixture: free, the Knight-Apostles can charge the squad at (4,7)';
        var other = _place(createUnit('covenant_of_new_jerusalem:covenant_levies', 1), 12, 3);
        G.activePlayer = 1;
        G.unitActivation = { uid: other.uid, phase: G.battlePhase, round: G.round };
        if (canDeclareCharge(knights).ok) return 'fixture: the activation holds the Knight-Apostles back now';
        _aiResetMoveEvalCache();
        var held = _aiChargeReachChance(knights, squad, 4, 7);
        if (held !== free) return "another unit's activation in progress still leaves them their charge this phase, " + free + ', got ' + held;
        if (G.unitActivation.uid !== other.uid) return 'the activation in progress is left as it was';
        return true;
      } finally {
        AI.player = saved;
        G.unitActivation = savedActivation;
        _aiClearMoveEvalCache();
      }
    });
  }},
});
