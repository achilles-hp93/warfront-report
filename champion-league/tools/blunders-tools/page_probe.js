// Page-side audit probe (scratch, analysis only). Wraps AI entry points and records the
// AI's own numbers for chosen units in chosen rounds. Observes only: calls deterministic
// scoring functions the AI itself calls (their caches fill with the values the AI would
// compute anyway), never draws from AI_RANDOM / RULES_RANDOM.
function installAuditProbe(cfg) {
  if (window.__auditProbe) return 'already';
  var P = window.__auditProbe = { dest: [], cands: [], abil: [], cmd: [], errors: [], tables: [] };
  var units = cfg.units || [];
  var want = function(u) {
    if (!u) return false;
    return units.some(function(t) {
      return t.name === u.name && t.player === u.player && (!t.rounds || t.rounds.indexOf(G.round) >= 0);
    });
  };
  var r2 = function(v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : v; };
  var nm = function(t) { return !t ? null : (t.name ? t.name : (t.col != null ? t.col + ',' + t.row : String(t).slice(0, 40))); };
  var err = function(w, e) { P.errors.push(w + ': ' + (e && e.message)); };
  var KEYS = ['cover', 'threat', 'range', 'offensive', 'support', 'objective', 'objective_risk', 'missive', 'obj_hold',
    'capture_blocker', 'screen', 'safety', 'obj_drift', 'role', 'posture', 'scout_caution', 'formation', 'total', 'threats_raw'];
  var bd = function(u, sq) {
    try {
      var b = aiScoreDestinationBreakdown(u, sq);
      var o = { sq: sq.col + ',' + sq.row };
      KEYS.forEach(function(k) { if (b[k]) o[k] = r2(b[k]); });
      return o;
    } catch (e) { err('bd', e); return null; }
  };

  // ── Destination choices ──
  var chooseDestOrig = window.aiChooseDestination;
  window.aiChooseDestination = function(unit, squares, opts) {
    var out = chooseDestOrig.apply(this, arguments);
    if (want(unit)) {
      try {
        var rec = { round: G.round, phase: G.battlePhase, unit: unit.name, at: unit.col + ',' + unit.row,
          opts: opts ? { extraMove: opts.extraMove, granted: !!opts.granted } : null, n: (squares || []).length,
          pick: out ? { sq: out.col + ',' + out.row, score: r2(out.score), toward: out.toward ? out.toward.col + ',' + out.toward.row : null } : null };
        rec.stay = bd(unit, { col: unit.col, row: unit.row });
        if (out) rec.pickBd = bd(unit, out);
        if (out && out.toward) rec.towardBd = bd(unit, out.toward);
        try {
          var gb = typeof _aiCachedGlobalBest === 'function' ? _aiCachedGlobalBest(unit) : null;
          if (gb) rec.globalBest = { sq: gb.col + ',' + gb.row, score: r2(gb.score), turnsAway: gb.turnsAway };
        } catch (e) { err('gb', e); }
        var scored = (squares || []).map(function(sq) { return { sq: sq, s: aiScoreDestination(unit, sq) }; })
          .sort(function(a, b) { return b.s - a.s; });
        rec.top = scored.slice(0, 6).map(function(x) { return bd(unit, x.sq); });
        try { rec.leaving = out ? r2(aiLeavingPrice(unit, out)) : null; } catch (e) {}
        try { rec.presenceLost = out ? r2(aiPresenceVpLost(unit, out)) : null; } catch (e) {}
        P.dest.push(rec);
      } catch (e) { err('dest', e); }
    }
    return out;
  };

  // ── Action candidates ──
  var collectOrig = window._aiCollectActions;
  var seen = {};
  window._aiCollectActions = function(unit) {
    var cands = collectOrig.apply(this, arguments);
    try {
      if (want(unit) && _aiMoveEvalCache()) {
        var key = G.round + '|' + G.battlePhase + '|' + unit.uid + '|' + (unit.ap) + '|' + cands.length;
        if (!seen[key]) {
          seen[key] = true;
          var sorted = cands.slice().sort(function(a, b) { return b.score - a.score; });
          P.cands.push({ round: G.round, phase: G.battlePhase, unit: unit.name, at: unit.col + ',' + unit.row, ap: unit.ap, n: cands.length,
            top: sorted.slice(0, 12).map(function(c) {
              return { type: c.type, ab: c.ability && c.ability.name || null, tgt: nm(c.target), score: r2(c.score),
                w: c.groups ? c.groups.map(function(g) { return g.weapon && g.weapon.name; }).join('+') : null };
            }) });
        }
      }
    } catch (e) { err('collect', e); }
    return cands;
  };

  // ── Ability scores ──
  var abil = cfg.abilities || [];
  if (abil.length && typeof window._aiScoreAbility === 'function') {
    var scoreAbOrig = window._aiScoreAbility;
    window._aiScoreAbility = function(unit, ability, target, opts) {
      var s = scoreAbOrig.apply(this, arguments);
      try {
        if (ability && abil.indexOf(ability.name) >= 0) {
          var rec = { round: G.round, phase: G.battlePhase, unit: unit && unit.name, ab: ability.name, tgt: nm(target), score: r2(s), ap: unit && unit.ap };
          try {
            if (target && target.uid != null && target.player !== unit.player) {
              var gun = aiExpectedDamage(unit, target);
              rec.gunHp = r2(gun);
              rec.gunCredit = r2(gun * aiTargetValue(target) * 1.2 * (gun >= _aiCurrentHP(target) ? aiW('KILL_BONUS_MULTIPLIER') : 1));
              rec.tgtHp = _aiCurrentHP(target); rec.tgtValue = r2(aiTargetValue(target)); rec.tgtThreat = r2(aiThreatValue(target));
              rec.dist = chebyshev(unit.col, unit.row, target.col, target.row);
              if (typeof _aiAbilityExpectedOnUnit === 'function') rec.expected = r2(_aiAbilityExpectedOnUnit(unit, ability, target).expected);
            }
          } catch (e) { err('gun', e); }
          if (ability.name === 'Lord of the Imperium') {
            try {
              rec.active = activeEntryId('tactica', unit.player);
              rec.preferredCycle = aiPreferredTableEntry('tactica', unit.player);
              rec.preferredAll = aiPreferredTableEntry('tactica', unit.player, activeTableEntries('tactica').map(function(e) { return e.id; }));
              rec.open = availableTableEntries('tactica', unit.player).map(function(e) { return e.id; });
            } catch (e) { err('tactica', e); }
          }
          P.abil.push(rec);
        }
      } catch (e) { err('abil', e); }
      return s;
    };
  }
  return 'installed';
}
