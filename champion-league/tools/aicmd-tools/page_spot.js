// Scratch page probe (not committed): at the first Battle Round's first Command Phase of
// player A, what the NEW Scouting Order reading counts for Speculatores, enemy by enemy;
// the battle then ends after Round 1.
(function() {
  var R = window.__battleRecord;
  if (!R || !R.probe) return;
  var P = R.probe;
  var w = window.__aicmdWhatIf;
  var prev = window.aiChooseHQCommand;
  window.aiChooseHQCommand = function(player) {
    if (G.round === 1 && player === 0 && !P.spot) {
      try {
        P.spot = w(function() {
          var u = _aiCommandFriendlies(0).filter(function(f) { return f.name === 'Speculatores'; })[0];
          var others = _aiCommandFriendlies(0).filter(function(f) { return f.col >= 0 && !isStructure(f) && footprintMembers(u).indexOf(f) < 0; });
          var pushes = _aiIsFirstTurnObjectivePush();
          var walk = function(x) { return getMovementPoints(x) + (pushes && _aiCanAdvance(x) ? advanceExpectedSuccesses(x) : 0); };
          var likely = aiUnitMoveChoice(u, { priced: true });
          var per = getEffectivePER(u);
          return { at: [u.col, u.row], per: per, likely: likely && [likely.type, likely.dest.col, likely.dest.row],
            count: _aiCommandNewSpotCount(u, 2),
            enemies: _aiCommandEnemies(0).filter(function(e) { return e.alive && e.col >= 0; }).map(function(e) {
              var gap = others.reduce(function(m, f) { return Math.min(m, chebyshev(f.col, f.row, e.col, e.row) - getEffectivePER(f) - walk(f)); }, 99);
              var sq = likely ? { col: likely.dest.col, row: likely.dest.row } : { col: u.col, row: u.row };
              return { n: e.name, at: [e.col, e.row], spotted: isSpotted(0, e.col, e.row, e), moved: !!e.moved, move: getMovementPoints(e), walk: walk(e), gap: gap,
                bonusOnly: seesSquareFrom(sq, per + 2, e.col, e.row, e) && !seesSquareFrom(sq, per, e.col, e.row, e) };
            }) };
        });
      } catch (e) { P.spot = ['ERR ' + e + ' ' + e.stack]; }
    }
    return prev.apply(this, arguments);
  };
  // The battle ends with Round 1's Cleanup: set there, no decision of the round reads it.
  var cleanup = window.beginCleanupPhaseEngine;
  window.beginCleanupPhaseEngine = function() {
    if (G.round >= 1) G.roundLimit = G.round;
    return cleanup.apply(this, arguments);
  };
})();
