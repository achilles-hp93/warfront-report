// Page-side probe: logs the movement AI's choices (read-only wrappers).
function installProbe(R, args) {
  args = args || {};
  R.probe = [];
  var want = function(u) {
    if (!u || G.phase !== 'BATTLE') return false;
    if (args.rounds && args.rounds.indexOf(G.round) < 0) return false;
    if (args.names && !args.names.some(function(n) { return (u.name || '').indexOf(n) >= 0; })) return false;
    return true;
  };
  var r2 = function(v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : v; };
  var terms = function(u, sq) {
    var bd = aiScoreDestinationBreakdown(u, sq), out = {};
    Object.keys(bd).forEach(function(k) { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) out[k] = r2(bd[k]); });
    return out;
  };
  var areaOf = function(col, row) {
    var objs = G.objectives || [];
    for (var i = 0; i < objs.length; i++) if (inObjectiveAreaOf(objs[i], col, row)) return objs[i];
    return null;
  };
  var ctl = function(obj) { return objectiveController(obj, { scoring: true }); };
  var push = function(e) { e.round = G.round; e.phase = G.battlePhase; e.vp = (G.players || []).map(function(p) { return p.vp || 0; }); R.probe.push(e); };
  var origChoose = aiChooseDestination;
  aiChooseDestination = function(unit, squares, opts) {
    var res = origChoose.apply(this, arguments);
    try {
      if (want(unit) && (args.allDest || areaOf(unit.col, unit.row))) {
        var g = (typeof _aiCachedGlobalBest === 'function' && !(opts && opts.granted)) ? _aiCachedGlobalBest(unit) : null;
        push({ kind: 'dest', name: unit.name, player: unit.player, at: [unit.col, unit.row], granted: !!(opts && opts.granted),
          pick: res ? [res.col, res.row] : null, pickScore: res ? r2(res.score) : null, toward: res && res.toward ? [res.toward.col, res.toward.row] : null,
          global: g ? { sq: [g.col, g.row], score: r2(g.score), turns: g.turnsAway } : null,
          stay: terms(unit, { col: unit.col, row: unit.row }), pickTerms: res ? terms(unit, res) : null,
          missive: (AI.missives && AI.missives[unit.uid]) ? { type: AI.missives[unit.uid].type, target: AI.missives[unit.uid].target ? [AI.missives[unit.uid].target.col, AI.missives[unit.uid].target.row] : null } : null });
      }
    } catch (e) { push({ kind: 'err', where: 'dest', msg: String(e) }); }
    return res;
  };
  var origFloor = _aiChargeFloor;
  _aiChargeFloor = function(unit, walk, charge) {
    var f = origFloor.apply(this, arguments);
    try { if (want(unit)) push({ kind: 'charge', name: unit.name, player: unit.player, at: [unit.col, unit.row], walk: walk ? [walk.col, walk.row] : null,
      charge: [charge.col, charge.row], score: r2(charge.score), success: r2(charge.success), floor: r2(f) }); } catch (e) {}
    return f;
  };
  var origLeaves = _aiChargeTargetLeaves;
  _aiChargeTargetLeaves = function(unit, target, sq) {
    var l = origLeaves.apply(this, arguments);
    try { if (want(unit)) push({ kind: 'leaves', name: unit.name, player: unit.player, target: target.name, sq: [sq.col, sq.row], leaves: l }); } catch (e) {}
    return l;
  };
  var origDecide = aiDecideMovement;
  aiDecideMovement = function(player) {
    var d = origDecide.apply(this, arguments);
    try {
      if (d && d.unit && want(d.unit)) {
        var u = d.unit, e = { kind: 'decide', name: u.name, player: u.player, type: d.type, from: [u.col, u.row], dest: d.dest ? [d.dest.col, d.dest.row] : null };
        var obj = areaOf(u.col, u.row);
        if (obj && d.dest) {
          e.obj = [obj.col, obj.row];
          e.leavesArea = !inObjectiveAreaOf(obj, d.dest.col, d.dest.row);
          e.ctlBefore = ctl(obj);
          e.ctlAfter = withFootprintAt(u, d.dest.col, d.dest.row, function() { return ctl(obj); });
        }
        push(e);
      }
    } catch (e2) { push({ kind: 'err', where: 'decide', msg: String(e2) }); }
    return d;
  };
  return 'probe installed';
}
