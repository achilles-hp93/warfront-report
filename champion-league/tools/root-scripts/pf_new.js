'use strict';

// scripts/battle_report/page_fallback.js - runs IN the game page beside
// page_recorder.js (record.cjs evaluates both): each Fall Back decision the AI weighs,
// with the board it weighed it on, so a report can ask whether it made sense.
//
// R.fallBacks is a list with one entry for each ENGAGED unit and Battle Round the AI
// decided whether to Fall Back (_aiEvalFallBack, ai/movement/evaluators.js), the round's
// last decision standing. A Fall Back a rule grants (core/movement/reposition.js) has
// no asking: its entry has no parts and no board.
//
// Only a decision is recorded: the weighing the Movement Phase decision asks
// (aiDecideMovement) of the board as it stands. The AI asks the same weighing as a
// question too - the charge planning asks a target's with the charger stood beside it
// (_aiChargeTargetLeaves, ai/movement/charge_value.js), an effect's value asks whether
// its unit will leave (_aiEffectUnitWillFallBack, ai/effect_value.js) in the Command
// Phase - and every board changed for a question is read set aside
// (rulesReadingAside, core/rules_reading.js: withFootprintAt, a scratch movement
// cache). Recorded, a probe overwrote the round's real decision with engagers that were
// never adjacent: every Champion League Day 1 report had such "held" entries.
//   { round, uid, name, player, fellBack, dest, test, parts, board }
// fellBack and dest: what the unit did; test: its FALL BACK test (rollFallBackTest).
// parts: the AI's own weighing. board: what the unit faced, asked of the engine:
//   hp, maxHp            the unit and any unit joined to it
//   engagers             [{ uid, name, hp, dealt, taken }]: each enemy beside it, the
//                        melee damage it is expected to deal the unit and to take from it
//   threat               the expected melee damage of every engager together
//   shotAt               { stay, dest }: the expected damage of every enemy that may
//                        shoot it as the board stands, at its square and at the
//                        square it would fall back to
//   killVp               { primary, cards }: the Primary VP killing it now would add for
//                        the enemy this round, and the enemy's secondary cards its death
//                        would complete (aiDeathVp)
//   objectives           [{ col, row, vp, now, ifLeaves, atDest }]: who controls each
//                        objective it stands in, now, without it, with it at the square
//   opensFire            the shots a Fall Back opens (aiFallBackOpensFire)
//   terms                { stay, dest }: aiScoreDestinationBreakdown at both squares
// Everything is asked through the engine's functions and put back as it was; it changes
// no rule and no decision.

function installFallBackRecorder(R) {
  if (R.fallBacks) return 'already installed';
  R.fallBacks = [];
  var inBattle = function() { return G.phase === 'BATTLE'; };
  var round2 = function(v) { return Math.round(v * 100) / 100; };
  var hpOf = function(unit) {
    return footprintMembers(unit).reduce(function(t, m) { return t + _aiCurrentHP(m); }, 0);
  };
  var maxHpOf = function(unit) {
    return footprintMembers(unit).reduce(function(t, m) { return t + _aiMaxHP(m); }, 0);
  };

  // Expected damage of every enemy that may shoot the unit where it stands.
  var shotAt = function(unit) {
    return round2(G.units.reduce(function(total, enemy) {
      if (!unitOnBoard(enemy) || enemy.player === unit.player || isStructure(enemy)) return total;
      var can = Weapons.groups(enemy, 'ranged').some(function(group) {
        return _canCompositionAttackWithWeapon(enemy, unit, group.weapon, {}).ok;
      });
      return can ? total + aiExpectedRangedDamage(enemy, unit) : total;
    }, 0));
  };

  // What the enemy scores if the unit is destroyed now by `killer`: the engine's own
  // answer (aiDeathVp, ai/missions/death_vp.js), which the AI's Fall Back weighs too.
  var killVp = function(unit, killer) {
    var v = aiDeathVp(unit, killer);
    return { primary: v.primary, cards: v.cards };
  };

  var objectivesAround = function(unit, dest) {
    return (G.objectives || []).filter(function(obj) {
      return inObjectiveAreaOf(obj, unit.col, unit.row) || (dest && inObjectiveAreaOf(obj, dest.col, dest.row));
    }).map(function(obj) {
      var control = function() { return objectiveController(obj, { scoring: true }); };
      var members = footprintMembers(unit);
      var ifLeaves;
      members.forEach(function(m) { m.alive = false; });
      try { ifLeaves = control(); } finally { members.forEach(function(m) { m.alive = true; }); }
      return {
        col: obj.col, row: obj.row, vp: obj.vp, here: inObjectiveAreaOf(obj, unit.col, unit.row),
        now: control(), ifLeaves: ifLeaves,
        atDest: dest ? withFootprintAt(unit, dest.col, dest.row, control) : null,
      };
    });
  };

  var terms = function(unit, sq) {
    if (!sq) return null;
    var bd = aiScoreDestinationBreakdown(unit, sq), out = {};
    Object.keys(bd).forEach(function(k) { if (typeof bd[k] === 'number') out[k] = round2(bd[k]); });
    return out;
  };

  var board = function(unit, dest, opensFire) {
    var engagers = getAdjacentEnemyUnits(unit).map(function(enemy) {
      return { uid: enemy.uid, name: enemy.name, hp: hpOf(enemy),
        dealt: round2(aiExpectedMeleeDamage(enemy, unit)), taken: round2(aiExpectedMeleeDamage(unit, enemy)) };
    });
    var killer = engagers.length ? unitByUid(engagers[0].uid) : null;
    return {
      hp: hpOf(unit), maxHp: maxHpOf(unit), engagers: engagers,
      threat: round2(engagers.reduce(function(t, e) { return t + e.dealt; }, 0)),
      shotAt: { stay: shotAt(unit), dest: dest ? withFootprintAt(unit, dest.col, dest.row, function() { return shotAt(unit); }) : null },
      killVp: killVp(unit, killer),
      objectives: objectivesAround(unit, dest),
      opensFire: opensFire || 0,
      terms: { stay: terms(unit, { col: unit.col, row: unit.row }), dest: terms(unit, dest) },
    };
  };

  var latest = {};    // round:uid -> the entry the round's last asking wrote
  var record = function(unit, entry) {
    var key = G.round + ':' + unit.uid;
    var at = latest[key];
    if (at != null && !R.fallBacks[at].fellBack) R.fallBacks[at] = entry;
    else if (at == null) { latest[key] = R.fallBacks.length; R.fallBacks.push(entry); }
  };
  var entryFor = function(unit, extra) {
    return Object.assign({ round: G.round, phase: G.battlePhase, uid: unit.uid, name: unit.name, player: unit.player,
      fellBack: false, dest: null, test: null }, extra);
  };

  // Inside the Movement Phase decision, and inside a board set aside for a question.
  var deciding = 0, aside = 0;
  var counting = function(name, add) {
    var orig = window[name];
    window[name] = function() {
      add(1);
      try { return orig.apply(this, arguments); } finally { add(-1); }
    };
  };
  counting('aiDecideMovement', function(n) { deciding += n; });
  counting('rulesReadingAside', function(n) { aside += n; });

  var evalOrig = window._aiEvalFallBack;
  window._aiEvalFallBack = function(unit) {
    var decision = deciding > 0 && aside === 0;
    var result = evalOrig.apply(this, arguments);
    if (!inBattle() || !unit || !decision) return result;
    try {
      var dest = result.dest || (result.parts && result.parts.bestDest) || null;
      var parts = {};
      Object.keys(result.parts || {}).forEach(function(k) {
        var v = result.parts[k];
        parts[k] = typeof v === 'number' ? round2(v) : v && v.col != null ? { col: v.col, row: v.row } : v;
      });
      record(unit, entryFor(unit, { decision: !!result.shouldFallBack, plannedDest: dest ? { col: dest.col, row: dest.row } : null,
        parts: parts, board: board(unit, dest, result.opensFire) }));
    } catch (e) { console.error('[battle-report] fall back', e.message); }
    return result;
  };

  // What the unit did: its FALL BACK test, then the square it reached.
  var testing = null;
  var testOrig = window.rollFallBackTest;
  window.rollFallBackTest = function(unit) {
    var result = testOrig.apply(this, arguments);
    if (inBattle() && unit) testing = { uid: unit.uid, test: {
      need: result.need, roll: result.roll, passed: result.passed, waiver: result.waiver, damage: result.damage, modelsKilled: result.modelsKilled } };
    return result;
  };
  var fallBackOrig = window.fallBack;
  window.fallBack = function(unit, col, row) {
    var result = fallBackOrig.apply(this, arguments);
    if (inBattle() && unit && result && result.ok !== false) {
      var key = G.round + ':' + unit.uid;
      var at = latest[key];
      var entry = at != null ? R.fallBacks[at] : null;
      if (!entry) { latest[key] = R.fallBacks.length; entry = entryFor(unit, { decision: true, parts: null, board: null }); R.fallBacks.push(entry); }
      entry.fellBack = true;
      entry.dest = { col: col, row: row };
      if (testing && testing.uid === unit.uid) entry.test = testing.test;
    }
    testing = null;
    return result;
  };
  return 'installed';
}
