// Scratch page probe (not committed): the battle ends with Round 2's Cleanup (the what-if
// records each Command Phase's candidates and Double Time readings on the way). Set at the
// Cleanup, no decision of the round reads the shortened battle.
(function() {
  var cleanup = window.beginCleanupPhaseEngine;
  window.beginCleanupPhaseEngine = function() {
    if (G.round >= 2) G.roundLimit = G.round;
    return cleanup.apply(this, arguments);
  };
})();
