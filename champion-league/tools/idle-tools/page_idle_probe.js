// Page-side probe (scratch, analysis only): records the AI's own readings for a few
// target units, by wrapping engine entry points. Observes only: it never draws from
// AI_RANDOM / RULES_RANDOM and changes no state the engine reads back.
function installIdleProbe(targets) {
  if (window.__idleProbe) return 'already';
  var P = window.__idleProbe = { log: [], choose: [], collect: [], moveChoice: [], dest: [], charge: [], push: [], adv: [], decide: [], roundEnd: [], errors: [] };
  var isT = function(u) { return !!u && targets.some(function(t) { return t.name === u.name && t.player === u.player; }); };
  var names = targets.map(function(t) { return t.name; });
  var r2 = function(v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : v; };
  var nm = function(t) { return !t ? null : (t.name ? t.name + (t.uid != null ? '#' + t.uid : '') : (t.col != null ? t.col + ',' + t.row : JSON.stringify(t).slice(0, 60))); };
  var err = function(where, e) { P.errors.push(where + ': ' + (e && e.message)); };
  var here = function() { return { round: G.round, phase: G.battlePhase, active: G.activePlayer }; };

  var unitState = function(u) {
    var s = { name: u.name, uid: u.uid, col: u.col, row: u.row, alive: u.alive, ap: u.ap, attacked: !!u.attacked,
      usedAction: !!u.usedAction, usedAbility: !!u.usedAbilityThisPhase, moved: !!u.moved };
    try { s.hp = typeof _aiCurrentHP === 'function' ? _aiCurrentHP(u) : null; } catch (e) {}
    try { s.canStillAct = aiUnitCanStillAct(u); } catch (e) { err('canStillAct', e); }
    try { s.block = activationBlockReason(u); } catch (e) { err('block', e); }
    try {
      s.forbidden = {};
      ['attack', 'ability', 'cast', 'channel_mana'].forEach(function(kind) {
        var bl = actionBlockReasons(u, kind) || [];
        if (bl.length) s.forbidden[kind] = bl.map(function(b) { return b.id + (b.reason ? ':' + String(typeof b.reason === 'function' ? '' : b.reason).slice(0, 80) : ''); });
      });
    } catch (e) { err('forbidden', e); }
    try { s.charged = typeof hasChargedThisRound === 'function' ? hasChargedThisRound(u) : null; } catch (e) {}
    try { s.advanced = !!(u.advanced || (typeof roundMarkIsThisRound === 'function' && roundMarkIsThisRound(u, 'advanced'))); } catch (e) {}
    try { s.inZOC = unitInZOC(u); } catch (e) {}
    try { s.statuses = (u.statuses || []).map(function(x) { return x.id || x.name || x; }); } catch (e) {}
    return s;
  };

  // What the unit could reach: weapons and the enemies near it, with the rules' own checks.
  var reachDiag = function(u) {
    var out = { weapons: [], enemies: [] };
    try {
      ['ranged', 'melee'].forEach(function(type) {
        Weapons.groups(u, type, { preview: true }).forEach(function(g) {
          var w = g.weapon || {};
          out.weapons.push({ type: type, name: w.name, range: w.range, tags: (w.tags || []).join(','), models: g.modelCount });
        });
      });
      var enemies = aliveUnits(1 - u.player).filter(function(e) { return e.col >= 0; });
      enemies.map(function(e) { return { e: e, d: chebyshev(u.col, u.row, e.col, e.row) }; })
        .sort(function(a, b) { return a.d - b.d; }).slice(0, 5).forEach(function(x) {
          var e = x.e, row = { name: e.name, at: e.col + ',' + e.row, d: x.d };
          try { row.los = hasLOS(u, e); } catch (er) {}
          row.checks = [];
          ['ranged', 'melee'].forEach(function(type) {
            Weapons.groups(u, type).forEach(function(g) {
              var res;
              try {
                res = type === 'melee' ? canMeleeAttack(u, e, g.weapon)
                  : (isAOEWeapon(g.weapon, u) ? _canCompositionAttackSquareWithWeapon(u, { col: e.col, row: e.row }, g.weapon, {}) : _canCompositionAttackWithWeapon(u, e, g.weapon, {}));
              } catch (er) { res = { ok: false, reason: 'threw ' + er.message }; }
              row.checks.push((g.weapon && g.weapon.name) + ':' + (res && res.ok ? 'OK' : (res && (res.reason || res.code || JSON.stringify(res).slice(0, 80)))));
            });
          });
          out.enemies.push(row);
        });
    } catch (e) { err('reachDiag', e); }
    return out;
  };

  var cdesc = function(c) {
    return { type: c.type, ab: c.ability && c.ability.name || null, tgt: nm(c.target), score: r2(c.score) };
  };

  // ── aiLog: every entry naming a target ──
  var logOrig = window.aiLog;
  window.aiLog = function(category, msg, data) {
    try {
      if (typeof msg === 'string' && names.some(function(n) { return msg.indexOf(n) >= 0; })) {
        P.log.push({ round: G.round, phase: G.battlePhase || G.phase, cat: category, msg: msg });
      }
    } catch (e) {}
    return logOrig.apply(this, arguments);
  };

  // ── The Action Phase choice ──
  var ctx = null;
  var chooseSeq = 0;
  var chooseOrig = window.aiChooseActionPhase;
  window.aiChooseActionPhase = function(player) {
    var mine = G.phase === 'BATTLE' ? G.units.filter(function(u) { return u.player === player && u.alive && u.col >= 0 && isT(u); }) : [];
    var entry = null;
    if (mine.length) {
      entry = Object.assign(here(), { seq: ++chooseSeq, player: player, units: mine.map(unitState), cands: {} });
      ctx = entry;
    }
    var out;
    try { out = chooseOrig.apply(this, arguments); } finally { ctx = null; }
    if (entry) {
      try {
        entry.best = out && out.best ? Object.assign({ unit: out.best.unit && out.best.unit.name }, cdesc(out.best)) : null;
        entry.actable = out ? out.actable : null;
        P.choose.push(entry);
      } catch (e) { err('choose', e); }
    }
    return out;
  };

  var collectOrig = window._aiCollectActions;
  window._aiCollectActions = function(unit) {
    if (!_aiMoveEvalCache()) return collectOrig.apply(this, arguments);
    var cands = collectOrig.apply(this, arguments);
    try {
      if (ctx && isT(unit) && !ctx.cands[unit.name]) {
        var sorted = cands.slice().sort(function(a, b) { return b.score - a.score; });
        var rec = sorted.slice(0, 10).map(cdesc);
        sorted.slice(0, 4).forEach(function(c, i) {
          try { rec[i].legal = _aiCandidateLegal(c, unit.player); } catch (e) { rec[i].legal = 'threw ' + e.message; }
        });
        ctx.cands[unit.name] = { n: cands.length, top: rec };
        if (!cands.some(function(c) { return /Attack$/.test(c.type); })) ctx.cands[unit.name].reach = reachDiag(unit);
      }
    } catch (e) { err('collect', e); }
    return cands;
  };

  // ── Movement ──
  var decideOrig = window.aiDecideMovement;
  window.aiDecideMovement = function(player) {
    var out = decideOrig.apply(this, arguments);
    try {
      if (out && out.unit && (isT(out.unit) || (out.unit.joinedCharacter != null && isT(unitByUid(out.unit.joinedCharacter))))) {
        P.decide.push(Object.assign(here(), { unit: out.unit.name, type: out.type, dest: out.dest ? { col: out.dest.col, row: out.dest.row, score: r2(out.dest.score) } : null }));
      }
    } catch (e) { err('decide', e); }
    return out;
  };

  var bdShort = function(bd) {
    var o = {};
    Object.keys(bd).forEach(function(k) { if (typeof bd[k] === 'number' && Math.abs(bd[k]) > 0.005) o[k] = r2(bd[k]); });
    o.role_name = bd.role_name; o.posture = bd.posture_name;
    return o;
  };
  var moveOrig = window.aiUnitMoveChoice;
  window.aiUnitMoveChoice = function(unit, opts) {
    var out = moveOrig.apply(this, arguments);
    try {
      if (isT(unit) && !(opts && opts.priced) && G.battlePhase === 'MOVEMENT') {
        var rec = Object.assign(here(), { unit: unit.name, at: unit.col + ',' + unit.row, out: out ? { type: out.type, col: out.dest.col, row: out.dest.row, score: r2(out.dest.score) } : null });
        rec.stay = bdShort(aiScoreDestinationBreakdown(unit, { col: unit.col, row: unit.row }));
        if (out && out.dest) rec.destBd = bdShort(aiScoreDestinationBreakdown(unit, out.dest));
        try {
          var gb = _aiCachedGlobalBest(unit);
          rec.globalBest = gb ? { col: gb.col, row: gb.row, score: r2(gb.score), turnsAway: gb.turnsAway } : null;
        } catch (e) { err('gb', e); }
        try { rec.objCommit = _aiCurrentObjectiveCommitment(unit) || null; if (rec.objCommit) rec.objCommit = JSON.parse(JSON.stringify(rec.objCommit, function(k, v) { return (v && typeof v === 'object' && v.uid != null && v.name) ? v.name : v; })); } catch (e) { err('objCommit', e); }
        try { rec.missive = (function(m) { return m ? { type: m.type, target: m.target ? (m.target.name || (m.target.col + ',' + m.target.row)) : null } : null; })(aiGetMissive(unit)); } catch (e) {}
        try { rec.move = getEffectiveMove(unit); } catch (e) {}
        try {
          var cd = canDeclareCharge(unit);
          rec.chargeDeclare = cd.ok ? 'ok' : cd.reason;
          if (cd.ok) {
            var maxMove = getMovementPoints(unit) + chargeDeclareReach(unit);
            var raw = reachableSquares(unit, 0, { mode: 'charge', maxMove: maxMove }).filter(function(s) { return s.isCharge && getChargeTargets(unit, s.col, s.row).length; });
            rec.chargeRaw = { maxMove: maxMove, adjacentToEnemy: raw.length, inSight: raw.filter(function(s) { return chargeSquareInSight(unit, s.col, s.row); }).length };
            if (!raw.length) {
              var all = reachableSquares(unit, 0, { mode: 'charge', maxMove: maxMove });
              var inSet = {}; all.forEach(function(s) { inSet[s.col + ',' + s.row] = s; });
              try {
                rec.chargeBlocks = (actionBlockReasons(unit, 'charge', { opts: { mode: 'charge', maxMove: maxMove, extraMove: 0 } }) || [])
                  .map(function(b) { return b.id + ':' + (typeof b.reason === 'string' ? b.reason : ''); });
                rec.chargeAll = all.length;
              } catch (x) { rec.chargeBlocks = ['threw ' + x.message]; }
              rec.chargeWhy = aliveUnits(1 - unit.player).filter(function(e) { return e.col >= 0 && chebyshev(unit.col, unit.row, e.col, e.row) <= 4; }).map(function(e) {
                var sqs = [];
                for (var dc = -1; dc <= 1; dc++) for (var dr = -1; dr <= 1; dr++) {
                  if (!dc && !dr) continue;
                  var c = e.col + dc, r = e.row + dr, k = c + ',' + r, s = inSet[k];
                  var occ = (G.units || []).filter(function(o) { return o.alive && o.col === c && o.row === r; }).map(function(o) { return o.name; }).join('+');
                  var imp = false; try { imp = movementSquareImpassable(unit, c, r); } catch (x) {}
                  sqs.push(k + (s ? (s.isCharge ? '[charge]' : '[reach,notCharge]') : '[unreached]') + (occ ? '{' + occ + '}' : '') + (imp ? '{impassable}' : ''));
                }
                return e.name + '@' + e.col + ',' + e.row + ': ' + sqs.join(' ');
              });
            }
          }
        } catch (e) { err('chargeDiag', e); }
        try {
          var sq = _aiCachedReachableSquares(unit, 0) || [];
          rec.nSquares = sq.length;
          rec.topLocal = sq.map(function(s) { return { col: s.col, row: s.row, score: aiScoreDestination(unit, s) }; })
            .sort(function(a, b) { return b.score - a.score; }).slice(0, 5).map(function(s) { return s.col + ',' + s.row + '=' + r2(s.score); });
        } catch (e) { err('topLocal', e); }
        P.moveChoice.push(rec);
      }
    } catch (e) { err('moveChoice', e); }
    return out;
  };

  var wrapRec = function(fname, list, pick) {
    var o = window[fname];
    if (typeof o !== 'function') { P.errors.push('no ' + fname); return; }
    window[fname] = function(unit) {
      var out = o.apply(this, arguments);
      try { if (isT(unit) && G.battlePhase === 'MOVEMENT') list.push(Object.assign(here(), { unit: unit.name }, pick(out, arguments))); } catch (e) { err(fname, e); }
      return out;
    };
  };
  wrapRec('_aiBestChargeSquare', P.charge, function(out, args) {
    return { fn: 'best', nSquares: args[1] && args[1].length, stay: r2(args[2]), floorLeast: r2(args[3]),
      pick: out ? { col: out.col, row: out.row, score: r2(out.score), target: nm(out.target), p: r2(out.successChance || out.p || out.prob) } : null };
  });
  wrapRec('_aiChargeFloor', P.charge, function(out, args) { return { fn: 'floor', value: r2(out), pick: args[1] ? args[1].col + ',' + args[1].row + '=' + r2(args[1].score) : null }; });
  wrapRec('aiChargeOutweighsStake', P.charge, function(out) { return { fn: 'stake', value: out }; });
  wrapRec('aiChargeOutcomeResolved', P.charge, function(out, args) {
    var o = args[1] || {};
    return { fn: 'outcome', target: nm(o.target), sq: o.sq ? o.sq.col + ',' + o.sq.row : null, value: r2(out && out.value), leaves: out && out.leaves,
      fight: r2(o.fight && o.fight.value), dealt: r2(o.fight && o.fight.dealt), leaving: r2(o.leaving) };
  });
  wrapRec('_aiChargeSquareOptions', P.charge, function(out, args) {
    var sq = args[1] || {};
    return { fn: 'option', sq: sq.col + ',' + sq.row, P: out ? r2(out.P) : null, pos: out ? r2(out.pos) : null, bound: out ? r2(out.bound) : null,
      fights: out ? out.outcomes.map(function(o) { return nm(o.target) + ':' + r2(o.fight.value) + (o.leaving === null ? '' : '/leave<=' + r2(o.leaving)); }).join(' ') : 'none (P below CHARGE_MIN_SUCCESS or no target)' };
  });
  wrapRec('aiChargeForgoneShot', P.charge, function(out) { return { fn: 'forgone', value: r2(out) }; });
  wrapRec('_aiEvalFirstTurnPush', P.push, function(out) { return { should: !!(out && out.shouldAdvance), dest: out && out.dest ? out.dest.col + ',' + out.dest.row : null, why: out && (out.reason || null) }; });
  wrapRec('_aiEvalAdvance', P.adv, function(out) { return { should: !!(out && out.shouldAdvance), dest: out && out.dest ? out.dest.col + ',' + out.dest.row : null, score: out && r2(out.score), why: out && (out.reason || null) }; });

  // ── Each round's end: where the targets stand, and what is near them ──
  var cleanOrig = window.endCleanupPhase;
  window.endCleanupPhase = function() {
    try {
      if (G.phase === 'BATTLE') {
        P.roundEnd.push({ round: G.round, objectives: (G.objectives || []).map(function(o) { return o.col + ',' + o.row; }),
          units: G.units.filter(function(u) { return isT(u); }).map(function(u) { var s = unitState(u); if (u.alive && u.col >= 0) s.reach = reachDiag(u); return s; }) });
      }
    } catch (e) { err('roundEnd', e); }
    return cleanOrig.apply(this, arguments);
  };
  return 'probe installed for ' + names.join(', ');
}
