(function() {
  return _pmBoard(function() {
    var saved = { player: AI.player, score: aiScoreDestination };
    try {
      AI.player = 0; G.battlePhase = 'MOVEMENT';
      AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
      var holder = _pmSquad(0, 2, 8);
      var squares = reachableSquares(holder);
      var normal = {}; squares.forEach(function(sq) { normal[sq.col + ',' + sq.row] = true; });
      aiScoreDestination = function(u, sq) { return normal[sq.col + ',' + sq.row] || (sq.col === u.col && sq.row === u.row) ? 0 : 2; };
      var adv = reachableSquares(holder, 0, { mode: 'advance', maxMove: getAdvanceMovementPoints(holder, advanceExpectedSuccesses(holder)) });
      var extra = adv.filter(function(sq) { return !normal[sq.col + ',' + sq.row]; });
      var cached = _aiCachedReachableSquares(holder).length;
      var info = extra.slice(0, 5).map(function(sq) { return [sq.col, sq.row, aiPresenceVpLost(holder, sq), aiPresenceVpSwing(holder, sq)]; });
      return { n: squares.length, cached: cached, extra: extra.length, info: info, res: _aiEvalAdvance(holder), src: _aiEvalAdvance.toString().indexOf('aiPresenceVpLost') };
    } finally { AI.player = saved.player; aiScoreDestination = saved.score; _aiClearMoveEvalCache(); }
  });
})()
