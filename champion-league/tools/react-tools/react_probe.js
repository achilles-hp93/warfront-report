// Injected into the game page beside the battle recorder (react_record.cjs): records, for
// every CHARGE declared (offerCountercharge: every Charge but a Countercharge's own), what
// could react to it, and the Reactions charging units then drew. Reads only; changes no
// state and draws no random number.
(function() {
  var P = window.__reactProbe = { charges: [], overwatch: [], faec: [], cc: [] };
  var name = function(u) { return u ? u.name : null; };
  var logLen = function() { return (G.combatLog || []).length; };
  var logSince = function(i) { return (G.combatLog || []).slice(i).map(function(e) { return e.msg || ''; }); };
  var wrap = function(fn, run) {
    var orig = window[fn];
    if (typeof orig !== 'function') { console.warn('[react-probe] no ' + fn); return; }
    window[fn] = function() { return run(orig, this, arguments); };
  };
  // The AI's own Reaction estimate for each charge square it weighed (the last one asked),
  // to set beside what the Charge then drew.
  P.estimates = {};
  if (typeof window.aiChargeReactions === 'function') {
    wrap('aiChargeReactions', function(orig, self, args) {
      var out = orig.apply(self, args);
      var u = args[0], sq = args[1];
      if (u && sq && out) {
        P.estimates[G.round + '|' + u.uid + '|' + sq.col + ',' + sq.row] = {
          cc: out.countercharge ? { by: name(unitByUid(out.countercharge.uid)), chance: out.countercharge.chance, fight: out.countercharge.fight } : null,
          movedHp: out.moved ? out.moved.hp : 0, movedCost: out.movedCost || 0 };
      }
      return out;
    });
  }
  if (typeof window._aiResolveChargeSquare === 'function') {
    wrap('_aiResolveChargeSquare', function(orig, self, args) {
      var out = orig.apply(self, args);
      var o = args[1];
      if (out && o && o.sq) {
        var e = P.estimates[G.round + '|' + args[0].uid + '|' + o.sq.col + ',' + o.sq.row] || (P.estimates[G.round + '|' + args[0].uid + '|' + o.sq.col + ',' + o.sq.row] = {});
        e.score = out.score; e.bound = o.bound; e.P = o.P;
      }
      return out;
    });
  }
  wrap('offerCountercharge', function(orig, self, args) {
    var charger = args[0], col = args[1], row = args[2];
    var rec = { round: G.round, phase: G.battlePhase, uid: charger.uid, name: charger.name, player: charger.player,
      from: [charger.col, charger.row], to: [col, row], granted: G.battlePhase !== 'MOVEMENT',
      estimate: P.estimates[G.round + '|' + charger.uid + '|' + col + ',' + row] || null };
    try {
      var cands = counterchargeCandidates(charger, col, row);
      rec.ccCandidates = cands.map(name);
      var defender = 1 - charger.player;
      var gated = cands.length ? _eligibleInterjections(COUNTERCHARGE_DECLARED_SEAM,
        { player: defender, candidates: cands, chargedUnits: [], charger: charger }) : [];
      rec.ccGated = gated.map(function(c) { var u = unitByUid(c.targetUid); return name(u); });
      rec.cp = G.players[defender] ? G.players[defender].cp : null;
      rec.watchers = withFootprintAt(charger, col, row, function() {
        return (G.units || []).filter(function(e) {
          return e && e.alive && e.col >= 0 && e.player !== charger.player && getOverwatchAttacks(e, charger).length > 0;
        }).map(name);
      });
      rec.responders = withFootprintAt(charger, col, row, function() { return fireAfterChargeResponders(charger).map(name); });
    } catch (err) { rec.error = String(err && err.message); }
    P.charges.push(rec);
    return orig.apply(self, args);
  });
  wrap('runOverwatchQueue', function(orig, self, args) {
    var target = args[0];
    var at = logLen();
    var charging = roundMarkIsThisRound(target, 'charge_ranged_lock') && G.battlePhase === 'MOVEMENT' || hasChargedThisRound(target);
    var hpBefore = target.alive ? Stats.health(target).current : 0;
    var out = orig.apply(self, args);
    var lines = logSince(at).filter(function(m) { return /Overwatch Reaction vs/.test(m); });
    if (lines.length) {
      var dmg = lines.reduce(function(t, m) { var x = /: (\d+) damage/.exec(m); return t + (x ? Number(x[1]) : 0); }, 0);
      P.overwatch.push({ round: G.round, phase: G.battlePhase, target: name(target), player: target.player, charging: !!charging,
        shots: lines.length, dmg: dmg, hpBefore: hpBefore, destroyed: !target.alive });
    }
    return out;
  });
  wrap('runFireAfterChargeQueue', function(orig, self, args) {
    var charger = args[0];
    var at = logLen();
    var out = orig.apply(self, args);
    var lines = logSince(at).filter(function(m) { return /: fires on /.test(m); });
    if (lines.length) {
      var dmg = lines.reduce(function(t, m) { var x = /\((\d+) damage\)/.exec(m); return t + (x ? Number(x[1]) : 0); }, 0);
      P.faec.push({ round: G.round, phase: G.battlePhase, target: name(charger), shots: lines.length, dmg: dmg });
    }
    return out;
  });
  // Time and count the charge pricing (re-entered calls timed once).
  P.timing = {};
  var depth = {};
  ['_aiBestChargeSquare', 'aiChargeReactions', 'aiOrderedChargeSquare', 'aiRepositionSquare', '_aiChargeTargetLeaves',
    '_aiResolveChargeSquare', 'aiCounterchargeWorth', 'aiAttackDrawnShots', 'aiOverwatchAttackOptions',
    '_aiPickBestCompositionAttack', 'aiChooseActionPhase'].forEach(function(fn) {
    if (typeof window[fn] !== 'function') return;
    wrap(fn, function(orig, self, args) {
      var cell = P.timing[fn] || (P.timing[fn] = { ms: 0, calls: 0 });
      cell.calls++;
      if (depth[fn]) return orig.apply(self, args);
      depth[fn] = 1;
      var t0 = performance.now();
      try { return orig.apply(self, args); } finally { cell.ms += performance.now() - t0; depth[fn] = 0; }
    });
  });
  // Event-offered ranged attacks (Return Volley) and what they did to the unit they answered.
  P.volleys = [];
  wrap('offerEventRangedAttack', function(orig, self, args) {
    var reactor = args[0], target = args[3] != null ? unitByUid(args[3]) : null;
    var before = target && target.alive ? Stats.health(target).current : null;
    var at = logLen();
    var out = orig.apply(self, args);
    var fired = logSince(at).some(function(m) { return m.indexOf(reactor.name) >= 0; });
    P.volleys.push({ round: G.round, phase: G.battlePhase, reactor: name(reactor), target: name(target), fired: fired,
      hpBefore: before, hpAfter: target && target.alive ? Stats.health(target).current : 0, destroyed: !!(target && !target.alive) });
    return out;
  });
  wrap('_counterchargeResolve', function(orig, self, args) {
    var charger = args[0], unit = args[1];
    P.cc.push({ round: G.round, phase: G.battlePhase, charger: name(charger), by: name(unit) });
    return orig.apply(self, args);
  });
  return 'react probe installed';
})();
