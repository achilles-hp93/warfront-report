(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteCQB',
  test: { name: 'SCRATCH m07 terrain', fn() {
    return _withCleanBoard(function() {
      var map = (MAPS_DATA || []).find(function(m) { return m.name === 'CROSSROADS' || m.id === 'CROSSROADS' || m.id === 'crossroads'; });
      setBoardFromMap(map);
      var out = [];
      for (var r = 5; r <= 11; r++) {
        var line = [];
        for (var c = 3; c <= 9; c++) line.push(c + ',' + r + ':' + String(terrainAt(c, r)).slice(0, 5));
        out.push(line.join(' '));
      }
      var walk = function(a, b, c2, d) { var sq = []; lineWalkSquares(a, b, c2, d, function(c, r) { sq.push(c + ',' + r + ':' + terrainAt(c, r)); return true; }); return sq.join(' '); };
      out.push('8,6->5,10: ' + walk(8, 6, 5, 10));
      out.push('8,6->5,9: ' + walk(8, 6, 5, 9));
      out.push('7,8->5,10: ' + walk(7, 8, 5, 10));
      out.push('8,7->5,10: ' + walk(8, 7, 5, 10));
      return out.join('\n');
    });
  }},
});
