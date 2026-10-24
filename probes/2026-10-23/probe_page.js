// Page-side probe: what the AI saw for watched units at each movement and action decision.
function installAiProbe(watchNames) {
  const P = window.__probe = [];
  const WATCH = new RegExp('^(' + watchNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$');
  const r2 = v => Math.round(v * 100) / 100;
  const terms = bd => { const o = {}; Object.keys(bd || {}).forEach(k => { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) o[k] = r2(bd[k]); }); return o; };
  const origPick = window._aiPickDestination;
  window._aiPickDestination = function(unit, extraMove) {
    const out = origPick.apply(this, arguments);
    if (unit && WATCH.test(unit.name) && G.phase === 'BATTLE') {
      try {
        const stay = aiScoreDestinationBreakdown(unit, { col: unit.col, row: unit.row });
        const gb = _aiCachedGlobalBest(unit);
        const squares = _aiCachedReachableSquares(unit, extraMove || 0) || [];
        const scored = squares.map(sq => ({ col: sq.col, row: sq.row, s: aiScoreDestination(unit, sq) })).sort((a, b) => b.s - a.s).slice(0, 6);
        P.push({ round: G.round, phase: G.battlePhase, kind: 'pick', unit: unit.name, at: [unit.col, unit.row], extraMove: extraMove || 0,
          move: getEffectiveMove(unit), firePenalty: _aiMoveFirePenalty(unit), stay: terms(stay), holds: (typeof _aiIndirectFireSupportHolds === "function") ? _aiIndirectFireSupportHolds(unit) : null, missive: aiGetMissive(unit) && aiGetMissive(unit).type, offStay: r2(_aiOffensivePotential(unit, unit.col, unit.row)),
          global: gb && { col: gb.col, row: gb.row, score: r2(gb.score), turnsAway: gb.turnsAway, path: (gb.path || []).slice(0, 6).map(p => [p.col, p.row]),
            terms: terms(aiScoreDestinationBreakdown(unit, gb)) },
          pick: out && { col: out.col, row: out.row, score: r2(out.score), terms: terms(aiScoreDestinationBreakdown(unit, out)) },
          top: scored.map(x => [x.col, x.row, r2(x.s)]) });
      } catch (e) { P.push({ err: String(e && e.stack) }); }
    }
    return out;
  };
  const origChoose = window.aiChooseDestination;
  window.aiChooseDestination = function(unit, squares, opts) {
    const out = origChoose.apply(this, arguments);
    if (unit && WATCH.test(unit.name) && opts && opts.granted && G.phase === 'BATTLE') {
      try {
        const kept = AI.globalTargets && AI.globalTargets[unit.uid];
        const plan = aiKeptGlobalPlan(unit);
        const stayBd = aiScoreDestinationBreakdown(unit, { col: unit.col, row: unit.row });
        P.push({ round: G.round, phase: G.battlePhase, kind: 'granted', unit: unit.name, at: [unit.col, unit.row],
          kept: kept && [kept.col, kept.row, kept.unit === unit], plan: plan && [plan.col, plan.row, r2(plan.score), plan.turnsAway],
          stay: terms(stayBd), firePen: _aiMoveFirePenalty(unit), missive: aiGetMissive(unit),
          squares: squares.length, out: out && [out.col, out.row, r2(out.score), !!out.toward] });
      } catch (e) { P.push({ err: String(e && e.stack) }); }
    }
    return out;
  };
  const origDecide = window.aiDecideMovement;
  window.aiDecideMovement = function() {
    const d = origDecide.apply(this, arguments);
    if (d && d.unit && WATCH.test(d.unit.name)) P.push({ round: G.round, kind: 'decide', unit: d.unit.name, type: d.type, from: [d.unit.col, d.unit.row], dest: d.dest && [d.dest.col, d.dest.row] });
    return d;
  };
  const origCollect = window._aiCollectActions;
  const seen = {};
  window._aiCollectActions = function(unit) {
    const out = origCollect.apply(this, arguments);
    if (unit && WATCH.test(unit.name) && G.phase === 'BATTLE' && G.battlePhase === 'ACTION') {
      const key = G.round + ':' + unit.uid + ':' + (unit.ap || 0);
      if (!seen[key]) {
        seen[key] = 1;
        try {
          P.push({ round: G.round, kind: 'actions', unit: unit.name, at: [unit.col, unit.row], ap: unit.ap,
            candidates: out.slice().sort((a, b) => b.score - a.score).slice(0, 8).map(c => ({ type: c.type,
              label: (c.ability && (c.ability.name || c.ability.id)) || (c.groups && c.groups.map(g => g.weaponName || g.name || g.legacyKey).join('+')) || null,
              target: c.target && (c.target.name || (c.target.col != null ? c.target.col + ',' + c.target.row : null)), square: c.square ? [c.square.col, c.square.row] : null,
              score: r2(c.score), legal: _aiCandidateLegal(c, unit.player) })) });
        } catch (e) { P.push({ err: String(e && e.stack) }); }
      }
    }
    return out;
  };
  return 'probe ok';
}

// Missives: what each watched unit was given, and what the capture-coverage step changed.
function installMissiveProbe(watchNames) {
  const P = window.__probe;
  const watched = u => u && watchNames.indexOf(u.name) >= 0;
  const r2 = v => Math.round(v * 100) / 100;
  const show = c => c && { type: c.type, target: c.target && (c.target.uid != null ? 'uid:' + c.target.uid : c.target.col + ',' + c.target.row), score: r2(c.score || 0) };
  const origCov = window._aiEnsureCaptureCoverage;
  window._aiEnsureCaptureCoverage = function(objDemand, unitCandidates, assignedChoices) {
    const before = {};
    Object.keys(assignedChoices).forEach(uid => { before[uid] = assignedChoices[uid]; });
    const out = origCov.apply(this, arguments);
    Object.keys(unitCandidates).forEach(uid => {
      const u = unitByUid(Number(uid));
      if (!watched(u)) return;
      P.push({ round: G.round, kind: 'missive', unit: u.name, at: [u.col, u.row], player: u.player,
        before: show(before[uid]), after: show(assignedChoices[uid]),
        cands: (unitCandidates[uid] || []).slice(0, 6).map(show),
        demand: objDemand.map(d => [d.obj.col + ',' + d.obj.row, r2(d.demand), d.assignedCount]) });
    });
    return out;
  };
  return 'missive probe ok';
}

// The objective term for each objective on its own, at the unit's square and the
// planner's goal, with what the AI reads of each objective.
function installObjectiveProbe(watchName) {
  const P = window.__probe;
  const r2 = v => Math.round(v * 100) / 100;
  const origPick = window._aiPickDestination;
  window._aiPickDestination = function(unit, extraMove) {
    if (unit && unit.name === watchName && G.phase === 'BATTLE') {
      try {
        const gb = _aiCachedGlobalBest(unit);
        const all = G.objectives;
        const per = all.map(obj => {
          let atStay, atGoal;
          try {
            G.objectives = [obj];
            atStay = _aiObjectiveScore(unit, unit.col, unit.row);
            atGoal = gb ? _aiObjectiveScore(unit, gb.col, gb.row) : null;
          } finally { G.objectives = all; }
          const rank = _aiCachedObjectiveRank(obj, AI.player, 2);
          const s = _aiCachedObjectiveSummary(obj);
          return { obj: obj.col + ',' + obj.row, owner: obj.owner, scorability: r2(_aiObjScorability(obj, AI.player)),
            rank: rank && [rank.ownership, rank.reachability, rank.threatRange, rank.contestability, rank.turnsToReach].join('/'),
            oc: [s.p0.oc, s.p1.oc], atStay: r2(atStay), atGoal: atGoal == null ? null : r2(atGoal) };
        });
        P.push({ round: G.round, kind: 'objectives', unit: unit.name, at: [unit.col, unit.row], move: getEffectiveMove(unit),
          goal: gb && [gb.col, gb.row, gb.turnsAway], missive: aiGetMissive(unit), per: per });
      } catch (e) { P.push({ err: String(e && e.stack) }); }
    }
    return origPick.apply(this, arguments);
  };
  return 'objective probe ok';
}

// Charges: every charge square scored for a watched unit, the reach, and what it had to beat.
function installChargeProbe(watchNames) {
  const P = window.__probe;
  const watched = u => u && watchNames.indexOf(u.name) >= 0 && G.phase === 'BATTLE';
  const r2 = v => Math.round(v * 100) / 100;
  const origReach = window.getChargeReachableSquares;
  window.getChargeReachableSquares = function(unit, opts) {
    const out = origReach.apply(this, arguments);
    if (watched(unit) && G.battlePhase === 'MOVEMENT' && !(opts && opts.ordered)) {
      try {
        const check = canDeclareCharge(unit, opts || {});
        const enemies = G.units.filter(e => e.alive && e.col >= 0 && e.player !== unit.player && !e.isHQ)
          .map(e => [e.name, chebyshev(unit.col, unit.row, e.col, e.row), (e.statuses && e.statuses.indexOf ? e.statuses.indexOf("HIDDEN") >= 0 : null)]).sort((a, b) => a[1] - b[1]).slice(0, 4);
        P.push({ round: G.round, kind: 'chargeReach', unit: unit.name, at: [unit.col, unit.row], ok: check.ok, why: check.reason || null,
          mp: getMovementPoints(unit), squares: out.length, nearest: enemies });
      } catch (e) { P.push({ err: String(e && e.stack) }); }
    }
    return out;
  };
  const origScore = window._aiScoreChargeSquare;
  window._aiScoreChargeSquare = function(unit, sq, stayScore) {
    const out = origScore.apply(this, arguments);
    if (watched(unit)) {
      try {
        const cost = sq.cost != null ? sq.cost : movementDistance(unit.col, unit.row, sq.col, sq.row);
        const targets = getChargeTargets(unit, sq.col, sq.row).map(t => t.name);
        P.push({ round: G.round, kind: 'chargeSq', unit: unit.name, sq: [sq.col, sq.row], cost: cost, P: r2(chargeReachChance(unit, cost, sq)),
          targets: targets, stay: stayScore == null ? null : r2(stayScore), land: r2(aiScoreDestination(unit, sq)), score: out ? r2(out.score) : null,
          held: (_aiObjectiveHeldBy(unit) || null) && [_aiObjectiveHeldBy(unit).col, _aiObjectiveHeldBy(unit).row] });
      } catch (e) { P.push({ err: String(e && e.stack) }); }
    }
    return out;
  };
  return 'charge probe ok';
}
