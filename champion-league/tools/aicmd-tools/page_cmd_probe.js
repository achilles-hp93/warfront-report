// Scratch page probe (not committed): what the AI weighed for its HQ commands and what
// the units it bought them for then did. Wraps the AI's own functions, reads only what
// they compute, changes nothing (each wrapper repeats the original's calls in order).
(function() {
  var R = window.__battleRecord;
  R.probe = { hq: [], moveDecisions: [], prices: [] };
  var P = R.probe;
  var r2 = function(x) { return x == null ? x : Math.round(x * 100) / 100; };
  var nm = function(t) { return t ? (t.name || (t.col != null ? t.col + ',' + t.row : '?')) : null; };
  var sqs = function(s) { return s ? [s.col, s.row] : null; };
  var watched = {};   // uid -> [{round, cmd}]
  // A build with the choice-priced extra MOVE: the wrapper returns the original's answer.
  window.__aicmdNew = typeof aiExtraMoveChoice === 'function';

  // Pricing internals: aiExtraMoveWorth, recomputed in the original's order.
  var origEMW = window.aiExtraMoveWorth;
  window.aiExtraMoveWorth = function(unit, extraMove, ctx) {
    if (!unit || !unit.alive || unit.col < 0 || !(extraMove > 0)) return 0;
    if (unitInZOC(unit)) return 0;
    var walk = _aiExtraMoveWalk(unit, extraMove);
    var charge = _aiExtraMoveCharge(unit, extraMove, ctx);
    var first = Math.max(0, Math.max(walk.with, charge.with) - Math.max(walk.without, charge.without));
    var out = window.__aicmdNew ? origEMW.apply(this, arguments) : first;
    try {
      P.prices.push({ round: G.round, phase: G.battlePhase, kind: 'move', unit: nm(unit), at: sqs(unit), extra: extraMove,
        walk: [r2(walk.with), r2(walk.without), sqs(walk.pick), walk.pick && walk.pick.toward ? sqs(walk.pick.toward) : null],
        charge: [r2(charge.with), r2(charge.without)], first: r2(first), worth: r2(out),
        bd: walk.pick ? (function() {
          var bdNum = function(bd) { var o = {}; Object.keys(bd).forEach(function(k) { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) o[k] = r2(bd[k]); }); return o; };
          return { stay: bdNum(aiScoreDestinationBreakdown(unit, { col: unit.col, row: unit.row })), pick: bdNum(aiScoreDestinationBreakdown(unit, walk.pick)),
            presence: r2(aiPresenceVpLost(unit, walk.pick)) };
        })() : null });
    } catch (e) { P.prices.push({ error: String(e) }); }
    return out;
  };
  var origHold = window.aiObjectiveHoldGains;
  window.aiObjectiveHoldGains = function(unit, ocBonus) {
    var out = origHold.apply(this, arguments);
    try {
      P.prices.push({ round: G.round, phase: G.battlePhase, kind: 'oc', unit: nm(unit), at: sqs(unit), bonus: ocBonus,
        gains: out.map(function(g) {
          var s = objectiveControlSummary(g.obj);
          var arr = aiEnemyArrivals(g.obj, unit.player);
          return { obj: [g.obj.col, g.obj.row], vp: g.vp, odds: r2(g.odds), oc: [s.p0.oc, s.p1.oc], units: [s.p0.units, s.p1.units], arrivals: arr.each };
        }) });
    } catch (e) { P.prices.push({ error: String(e) }); }
    return out;
  };
  var origSpot = window._aiCommandNewSpotCount;
  window._aiCommandNewSpotCount = function(unit, perBonus, enemies) {
    var out = origSpot.apply(this, arguments);
    try { P.prices.push({ round: G.round, phase: G.battlePhase, kind: 'per', unit: nm(unit), at: sqs(unit), spots: out }); } catch (e) {}
    return out;
  };

  var origChoose = window.aiChooseHQCommand;
  var lastCands = null;
  var origBuild = window.aiBuildHQCommandCandidates;
  window.aiBuildHQCommandCandidates = function(player) {
    var out = origBuild.apply(this, arguments);
    lastCands = out;
    return out;
  };
  window.aiChooseHQCommand = function(player) {
    var cp = (G.players[player] && G.players[player].cp) || 0;
    lastCands = null;
    var mark = P.prices.length;
    var out = origChoose.apply(this, arguments);
    try {
      var entry = { round: G.round, player: player, cp: cp,
        cands: (lastCands || []).map(function(c) { return [c.cmd.name, nm(c.target), r2(c.weight), c.cpCost]; }),
        chosen: out.candidate ? [out.candidate.cmd.name, nm(out.candidate.target), r2(out.candidate.weight), out.candidate.cpCost,
          out.candidate.moveDest ? sqs(out.candidate.moveDest) : null] : null,
        pass: out.pass || null,
        prices: P.prices.slice(mark).filter(function(p) { return !out.candidate || !out.candidate.target || p.unit === nm(out.candidate.target); }),
      };
      P.prices.length = mark;
      if (out.candidate && out.candidate.target && out.candidate.target.uid != null) {
        var t = out.candidate.target;
        (watched[t.uid] = watched[t.uid] || []).push({ round: G.round, cmd: out.candidate.cmd.name });
        entry.globalTarget = AI.globalTargets && AI.globalTargets[t.uid] ? [AI.globalTargets[t.uid].col, AI.globalTargets[t.uid].row] : null;
      }
      P.hq.push(entry);
    } catch (e) { P.hq.push({ error: String(e) }); }
    return out;
  };

  // The Movement Phase choice of a watched unit: wrap the evaluators it asks.
  var cur = null;
  var wrap = function(name, rec) {
    var orig = window[name];
    window[name] = function() {
      var out = orig.apply(this, arguments);
      try { if (cur && arguments[0] === cur.unit_) cur[name] = rec(out, arguments); } catch (e) { if (cur) cur[name] = 'err ' + e; }
      return out;
    };
  };
  var wrapAny = function(name, rec) {
    var orig = window[name];
    window[name] = function() {
      var out = orig.apply(this, arguments);
      try {
        var u = arguments[0];
        if (u && watched[u.uid] && watched[u.uid].some(function(w) { return w.round === G.round; }) && G.battlePhase === 'MOVEMENT') {
          P.moveDecisions.push({ round: G.round, unit: u.name, at: [u.col, u.row], fallBackEval: rec(out) });
        }
      } catch (e) {}
      return out;
    };
  };
  wrap('_aiPickDestination', function(out) { return out ? [out.col, out.row, r2(out.score)] : null; });
  wrap('_aiBestChargeSquare', function(out) { return out ? [out.col, out.row, r2(out.score), r2(out.success)] : null; });
  wrap('_aiChargeFloor', function(out) { return r2(out); });
  wrap('_aiEvalAdvance', function(out) { return out && out.shouldAdvance ? sqs(out.dest) : false; });
  wrap('_aiEvalFirstTurnPush', function(out) { return out && out.shouldAdvance ? sqs(out.dest) : false; });
  wrapAny('_aiEvalFallBack', function(out) { return out ? { fb: !!out.shouldFallBack, dest: sqs(out.dest), stay: out.parts && r2(out.parts.stay), fall: out.parts && r2(out.parts.fallBack) } : null; });
  var origScore = window.aiScoreDestination;

  var origDecide = window.aiDecideMovement;
  window.aiDecideMovement = function(player) {
    var evals = [];
    var origSortP = null;
    // One record per watched unit evaluated in this decision.
    var origCalls = {};
    var units = G.units.filter(function(u) { return u.alive && watched[u.uid] && watched[u.uid].some(function(w) { return w.round === G.round; }) && !u.moved; });
    var recs = units.map(function(u) {
      return { round: G.round, unit: u.name, at: [u.col, u.row], cmds: watched[u.uid].filter(function(w) { return w.round === G.round; }).map(function(w) { return w.cmd; }),
        globalTarget: AI.globalTargets && AI.globalTargets[u.uid] ? [AI.globalTargets[u.uid].col, AI.globalTargets[u.uid].row] : null,
        move: getMovementPoints(u), unit_: u };
    });
    // Evaluate: we only see the evaluators' answers for the unit the loop reaches.
    var setCur = function(u) { cur = recs.find(function(r) { return r.unit_ === u; }) || null; };
    var origIngress = window.aiTransportPlanIngressMove;
    window.aiTransportPlanIngressMove = function(u) { setCur(u); return origIngress.apply(this, arguments); };
    var origFb = window._aiEvalFallBack;
    var out;
    try { out = origDecide.apply(this, arguments); } finally { window.aiTransportPlanIngressMove = origIngress; cur = null; }
    try {
      recs.forEach(function(r) {
        var u = r.unit_; delete r.unit_;
        if (out && out.unit === u) {
          r.decision = { type: out.type, dest: sqs(out.dest) };
          P.moveDecisions.push(r);
        } else if (r._aiPickDestination !== undefined || r._aiEvalFallBack !== undefined) {
          r.decision = out ? 'another unit: ' + out.unit.name : 'pass';
          P.moveDecisions.push(r);
        }
      });
    } catch (e) { P.moveDecisions.push({ error: String(e) }); }
    // A unit that leaves an Objective Area it stands in: what it weighed.
    try {
      var u = out && out.unit, dest = out && out.dest;
      var held = u && dest && (G.objectives || []).filter(function(o) { return inObjectiveAreaOf(o, u.col, u.row); })[0];
      if (held && !inObjectiveAreaOf(held, dest.col, dest.row)) {
        var bdNum = function(bd) { var o = {}; Object.keys(bd).forEach(function(k) { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) o[k] = r2(bd[k]); }); return o; };
        var rec = aiWithMoveEvalCache(function() {
          var sw = aiPresenceVpSwing(u, dest);
          var s = objectiveControlSummary(held);
          return { round: G.round, unit: u.name, at: [u.col, u.row], obj: [held.col, held.row], oc: [s.p0.oc, s.p1.oc], type: out.type, dest: sqs(dest),
            destScore: r2(dest.score), stay: bdNum(aiScoreDestinationBreakdown(u, { col: u.col, row: u.row })), there: bdNum(aiScoreDestinationBreakdown(u, dest)),
            presence: { lost: r2(sw.lost), gained: r2(sw.gained), primary: r2(sw.primary), missions: r2(sw.missions), objLost: r2(sw.objective.lost), objGained: r2(sw.objective.gained),
              stake: typeof aiPresenceVpAtStake === 'function' ? r2(aiPresenceVpAtStake(u, dest)) : null,
              rate: typeof aiPresenceVpRate === 'function' ? r2(aiPresenceVpRate(u)) : null },
            held: typeof aiHeldObjective === 'function' && aiHeldObjective(u) ? [aiHeldObjective(u).col, aiHeldObjective(u).row] : null,
            gt: AI.globalTargets && AI.globalTargets[u.uid] ? [AI.globalTargets[u.uid].col, AI.globalTargets[u.uid].row] : null,
            bought: aiMoveWasBought(u) };
        });
        (P.leaves = P.leaves || []).push(rec);
      }
    } catch (e) { (P.leaves = P.leaves || []).push({ error: String(e) }); }
    return out;
  };
})();
