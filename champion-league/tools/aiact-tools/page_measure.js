// Scratch probe (aiact): at each Round 1 move choice, the AI's own readings of what
// each footprint member could do this round, and what it costs to read them.
function installProbe() {
  var P = window.__probe = { rows: [], errors: [] };
  var r2 = function(v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : v; };
  var orig = window.aiUnitMoveChoice;
  var depth = 0;
  window.aiUnitMoveChoice = function(unit, opts) {
    var out = orig.apply(this, arguments);
    if (depth || (opts && opts.priced) || G.round > 2 || G.battlePhase !== 'MOVEMENT') return out;
    depth++;
    try {
      var row = { round: G.round, unit: unit.name, player: unit.player, at: unit.col + ',' + unit.row, choice: out ? out.type + '@' + out.dest.col + ',' + out.dest.row : null, members: [] };
      footprintMembers(unit).forEach(function(m) {
        var t = Date.now();
        var best = null;
        var phase = G.battlePhase;
        G.battlePhase = 'ACTION';
        try { best = aiWithMoveEvalCache(function() { return aiUnitBestAction(m); }); } catch (e) { P.errors.push(e.message); } finally { G.battlePhase = phase; }
        var ms = Date.now() - t;
        var shot = aiWithMoveEvalCache(function() { return aiChargeForgoneShot(m); });
        row.members.push({ name: m.name, best: best ? best.type + (best.ability ? ':' + best.ability.name : '') + (best.rite ? ':' + best.rite.name : '') + '>' + (best.target && best.target.name || '') : null,
          score: best ? r2(best.score) : null, ms: ms, shot: r2(shot) });
      });
      P.rows.push(row);
    } catch (e) { P.errors.push(e.message); } finally { depth--; }
    return out;
  };
  return 'ok';
}
