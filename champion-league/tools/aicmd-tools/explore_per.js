(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'zz explore per', fn: function() {
    return _pmBoard(function() {
      G.round = 2; G.battlePhase = 'COMMAND'; AI.player = 0;
      var s = _pmSquad(0, 7, 13);
      var e = _pmSquad(1, 2, 5);
      var out = { per: getEffectivePER(s), move: getMovementPoints(s), range: getEffectiveRange(s), spotted: isSpotted(0, 2, 5, e),
        sees8: seesSquareFrom({ col: 7, row: 13 }, 8, 2, 5, e), sees6: seesSquareFrom({ col: 7, row: 13 }, 6, 2, 5, e) };
      return JSON.stringify(out);
    });
  } },
});
