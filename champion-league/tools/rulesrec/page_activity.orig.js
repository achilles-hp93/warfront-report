'use strict';

// scripts/battle_report/page_activity.js - runs IN the game page beside
// page_recorder.js (record.cjs evaluates both): what each unit did with its APt,
// round by round. Every unit has 1 APt a Battle Round; a move in the Movement Phase
// costs Movement Points, not APt.
//
// R.activity is a list of { round, uid, kind }, one entry for each:
//   idle       a Battle Round the unit stood on the battlefield with APt it could
//              spend and spent none: the engine's own test for holding fire
//              (unitHeldFireInRound, combat/overwatch_ready.js), asked at the round's end
//   overwatch  an Overwatch shot (it held its fire the round before)
//   movement   APt spent in the Movement Phase: a Fall Back, an Embark
//   ranged     a ranged attack it made (not an Overwatch shot)
//   melee      a melee attack it made, or a counterattack it paid for
//   ability    an ability it used; one that fires a weapon counts as that ranged or
//              melee attack instead, and one that casts as magic
//   magic      a rite cast, or Channel Mana
//   objective  a Battle Round the unit held ground: at the round's scoring it stood in an
//              Objective Area and counted toward it - its OC there above 0 (getEffectiveOC;
//              an OC anchored on the objective, its anchor's) - `at` the objectives it held.
//              Such a round is not idle: the user's ruling, "if they are on an objective
//              then they are not idle" (2026-10-29)
// Each entry carries `player`, the unit's side as it happened (a seizure changes it).
// It wraps the engine's own entry points and changes no rule.

function installActivityRecorder(R) {
  if (R.activity) return 'already installed';
  R.activity = [];
  var inBattle = function() { return G.phase === 'BATTLE'; };
  var note = function(unit, kind, extra) {
    if (!unit || unit.uid == null || !inBattle()) return;
    R.activity.push(Object.assign({ round: G.round, phase: G.battlePhase, uid: unit.uid, player: unit.player, kind: kind }, extra));
  };
  // What is running: { kind, uid, weapon } for an ability (its weapon, when it fires
  // one), { kind } for an attack, a cast or an Overwatch reaction.
  var running = [];
  var top = function() { return running[running.length - 1] || null; };
  var wrap = function(name, before, after) {
    var orig = window[name];
    if (typeof orig !== 'function') { console.warn('[battle-report] no ' + name); return; }
    window[name] = function() {
      var frame = before.apply(null, arguments);
      if (frame) running.push(frame);
      try { return orig.apply(this, arguments); } finally {
        if (frame) { running.pop(); if (after) after(frame); }
      }
    };
  };
  // An attack: counted for its attacker, unless an ability fired it (the ability is
  // counted as this attack) or it is an Overwatch shot, or it runs inside another attack.
  var attack = function(kind) {
    return function(attacker, target, granted, opts) {
      var outer = top();
      if (outer && outer.kind === 'ability' && attacker && attacker.uid === outer.uid) {
        if (!outer.weapon) outer.weapon = kind;
        return null;
      }
      if (outer && (outer.kind === 'overwatch' || outer.kind === 'attack' || outer.kind === 'magic')) return null;
      if (opts && opts.reaction) return null;
      note(attacker, kind);
      return { kind: 'attack' };
    };
  };
  wrap('resolveCompositionRangedAttack', attack('ranged'));
  // A blast fired at a square (a Morphean Engine's shell): left out, the Engine showed
  // no action in six battles in which it fired most rounds.
  wrap('resolveCompositionBlastAttack', attack('ranged'));
  wrap('resolveGrantedRangedAttack', attack('ranged'));
  wrap('resolveMeleeAttack', attack('melee'));
  wrap('triggerOverwatchReaction', function(watcher) { note(watcher, 'overwatch'); return { kind: 'overwatch' }; });
  wrap('payCounterattack', function(defender) { note(defender, 'melee'); return null; });
  var cast = function(caster) {
    var outer = top();
    if (outer && outer.kind === 'ability' && caster && caster.uid === outer.uid) {
      if (!outer.weapon) outer.weapon = 'magic';
      return null;
    }
    if (outer) return null;
    note(caster, 'magic');
    return { kind: 'magic' };
  };
  wrap('castRite', cast);
  wrap('channelMana', cast);
  wrap('useAbility', function(unit) {
    if (top() || !unit) return null;
    return { kind: 'ability', uid: unit.uid, unit: unit };
  }, function(frame) { note(frame.unit, frame.weapon || 'ability'); });
  // CHANGE ALTITUDE (HOVER) spends its APt on movement, in the Action Phase.
  wrap('resolveChangeAltitude', function(unit) {
    return top() || !unit ? null : { kind: 'altitude', unit: unit, ap: unit.ap || 0 };
  }, function(frame) { if ((frame.unit.ap || 0) < frame.ap) note(frame.unit, 'movement'); });
  // APt spent in the Movement Phase outside every attack, cast and ability: a Fall
  // Back, an Embark.
  var spendOrig = window.spendUnitAPt;
  window.spendUnitAPt = function(unit, amount) {
    var spent = spendOrig.apply(this, arguments);
    if (spent > 0 && !top() && G.battlePhase === 'MOVEMENT') note(unit, 'movement');
    return spent;
  };

  // ── Why a unit was idle ──
  // When a player passes the rest of its Action Phase (aiChooseActionPhase, ai/action/
  // choose.js, finds nothing worth MIN_ACTION_THRESHOLD), each unit that could still act
  // is asked for the best legal action it had, the AI's own candidates and scores
  // (_aiCollectActions, _aiCandidateLegal). An idle entry carries it as `why`:
  // { action, score }, or { action: null } when the unit had no legal action at all.
  var whyIdle = {};
  var round2 = function(v) { return Math.round(v * 100) / 100; };
  var describe = function(c) {
    return c.type + (c.ability && c.ability.name ? ' ' + c.ability.name : '')
      + (c.target && c.target.name ? ' on ' + c.target.name : '');
  };
  var passOrig = window.aiChooseActionPhase;
  if (typeof passOrig === 'function') {
    window.aiChooseActionPhase = function(player) {
      var out = passOrig.apply(this, arguments);
      if (inBattle() && out && !out.best) {
        try {
          aiWithMoveEvalCache(function() {
            aiActableUnits(player).forEach(function(unit) {
              var best = null;
              _aiCollectActions(unit).forEach(function(c) {
                if ((!best || c.score > best.score) && _aiCandidateLegal(c, player)) best = c;
              });
              whyIdle[G.round + ':' + unit.uid] = best ? { action: describe(best), score: round2(best.score) } : { action: null };
            });
          });
        } catch (e) { console.error('[battle-report] idle reason', e.message); }
      }
      return out;
    };
  }

  // ── Holding an objective, asked just before the round's objectives score ──
  var held = {};
  var holders = function() {
    var out = {};
    (G.objectives || []).forEach(function(obj) {
      var anchors = typeof objectiveOcAnchorsFor === 'function' ? objectiveOcAnchorsFor(obj) : [];
      G.units.forEach(function(u) {
        if (!u.alive || u.col == null || u.col < 0 || isStructure(u) || !inObjectiveAreaOf(obj, u.col, u.row)) return;
        var anchor = anchors.find(function(a) { return a.uid === u.uid; });
        if (!((anchor ? anchor.oc : getEffectiveOC(u)) > 0)) return;
        (out[u.uid] = out[u.uid] || { unit: u, at: [] }).at.push(obj.name || '(' + obj.col + ',' + obj.row + ')');
      });
    });
    return out;
  };
  var scoreOrig = window.scoreObjectives;
  if (typeof scoreOrig === 'function') {
    window.scoreObjectives = function() {
      var standing = null;
      if (inBattle()) {
        try { standing = holders(); } catch (e) { console.error('[battle-report] holding', e.message); }
      }
      var out = scoreOrig.apply(this, arguments);
      // Only where the objectives scored (Seize the Ground).
      if (standing && Array.isArray(out)) Object.keys(standing).forEach(function(uid) {
        held[G.round + ':' + uid] = true;
        note(standing[uid].unit, 'objective', { at: standing[uid].at });
      });
      return out;
    };
  } else console.warn('[battle-report] no scoreObjectives');

  // ── Idle rounds, asked as each round ends (and as the battle ends inside one) ──
  var idleDone = {};
  var noteIdle = function() {
    if (!inBattle() || idleDone[G.round]) return;
    idleDone[G.round] = true;
    G.units.forEach(function(u) {
      if (!u.alive || u.col == null || u.col < 0 || isStructure(u) || held[G.round + ':' + u.uid]) return;
      if (unitHeldFireInRound(u, G.round)) note(u, 'idle', { why: whyIdle[G.round + ':' + u.uid] || null });
    });
  };
  // A live report (record.cjs --live) asks at its Cleanup pause, before END PHASE: no
  // APt is spent between the two, so the answer is the same.
  R.noteIdle = noteIdle;
  wrap('endCleanupPhase', function() { try { noteIdle(); } catch (e) { console.error('[battle-report] idle', e.message); } return null; });
  wrap('showVictory', function() { try { noteIdle(); } catch (e) { console.error('[battle-report] idle', e.message); } return null; });
  return 'installed';
}
