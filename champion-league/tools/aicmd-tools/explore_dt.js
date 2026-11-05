(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'zz explore dt', fn: function() {
    return _pmBoard(function() {
      var saved = AI.player;
      try {
        AI.player = 0; G.round = 1; G.battlePhase = 'COMMAND';
        var out = [];
        [[[7, 12], [11, 5]], [[7, 12], [12, 8]], [[7, 13], [12, 8]], [[7, 12], [3, 5]], [[7, 13], [7, 3]]].forEach(function(pair) {
          var at = pair[0];
          var u = _pmSquad(0, at[0], at[1]);
          var foe = _pmSquad(1, pair[1][0], pair[1][1]);
          u.moved = false; foe.moved = true;
          AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
          var r = aiWithMoveEvalCache(function() {
            var walk = _aiExtraMoveWalk(u, 2);
            var choice = aiUnitMoveChoice(u, { priced: true });
            var ch = aiExtraMoveChoice(u, 2);
            return { range: getEffectiveRange(u), dmg: aiExpectedDamage(u, foe), evalAdv: _aiEvalAdvance(u).shouldAdvance,
              walk: [walk.with, walk.without, walk.pick && [walk.pick.col, walk.pick.row]],
              choice: choice && [choice.type, choice.dest.col, choice.dest.row], withChoice: ch.choice && [ch.choice.type, ch.choice.dest.col, ch.choice.dest.row], gain: ch.gain,
              worth: aiExtraMoveWorth(u, 2, { player: 0 }) };
          });
          out.push(JSON.stringify(pair) + ' ' + JSON.stringify(r));
          u.alive = false; u.col = -1; foe.alive = false; foe.col = -1;
        });
        return out.join('\n');
      } finally { AI.player = saved; _aiClearMoveEvalCache(); }
    });
  } },
});
