// Scratch page probe (not committed): each Bogatyr / Veche move decision, as the AI weighed it.
(function() {
  var R = window.__battleRecord;
  R.hq = []; R.picks = [];
  var r2 = function(x) { return Math.round(x * 100) / 100; };
  var pick = function(bd) { var o = {}; Object.keys(bd || {}).forEach(function(k) { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) o[k] = r2(bd[k]); }); return o; };
  var orig = window.aiChooseDestination;
  window.aiChooseDestination = function(unit, squares, opts) {
    var out = orig.apply(this, arguments);
    try {
      if (unit && /Bogatyr|Veche/.test(unit.name) && !(opts && opts.greedy)) {
        var m = aiGetMissive(unit);
        var gb = _aiCachedGlobalBest(unit);
        R.picks.push({ round: G.round, phase: G.battlePhase, name: unit.name, at: [unit.col, unit.row],
          missive: m && { type: m.type, target: m.target && [m.target.col, m.target.row] },
          firePenalty: r2(_aiMoveFirePenalty(unit)),
          stay: pick(aiScoreDestinationBreakdown(unit, { col: unit.col, row: unit.row })),
          global: gb && { at: [gb.col, gb.row], score: r2(gb.score), bd: pick(aiScoreDestinationBreakdown(unit, { col: gb.col, row: gb.row })) },
          chose: out && { at: [out.col, out.row], score: r2(out.score), toward: out.toward ? [out.toward.col, out.toward.row] : null,
            bd: pick(aiScoreDestinationBreakdown(unit, { col: out.col, row: out.row })) } });
      }
    } catch (e) { R.picks.push({ error: String(e && e.stack || e) }); }
    return out;
  };
})();
