import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'engine/modules/core/joined_units.js': [
  ('''// ── A pair destroyed together is one unit destroyed ──────────────────────────
// Its two units die one after the other, and the first death ends the pair, so a
// counter of destroyed units saw two (user ruling, 2026-10-29: Champion League
// D1-M15 paid MAN OF THE HOUR for Host Sotnia 2 and the Kharakternyk leading it,
// both killed by one attack). Each death is counted under a key: a unit that dies
// joined is counted under its pair's, and so is its partner when that one dies in
// the same attack - or, outside any attack (a failed Fall Back's damage), in the
// same activation; any other death under the unit's own uid. Every counter of
// destroyed units counts keys (combat/battle_tracking.js hands each death's on to
// the missions and the Primaries): a pair whose CHARACTER fell in one attack and
// its squad in a later one is two units destroyed, as a destroyed CHARACTER is a
// destroyed unit.

// The moment a death belongs to: the attack resolving (combat/attack_activation.js),
// else the activation, in its phase and Battle Round.
function _pairDeathMoment() {
  return G.unitActivationSeq + '|' + (attackActivationStamp() || G.round + ':' + G.battlePhase + ':-');
}
''', '''// ── A pair destroyed together is one unit destroyed ──────────────────────────
// Its two units die one after the other, and the first death ends the pair, so a
// counter of destroyed units saw two (user ruling, 2026-10-29: Champion League
// D1-M15 paid MAN OF THE HOUR for Host Sotnia 2 and the Kharakternyk leading it,
// both killed by one attack). Each death is counted under a key: a unit that dies
// joined is counted under its pair's, and so is its partner when that one dies in
// the same activation; any other death under the unit's own uid. Every counter of
// destroyed units counts keys (combat/battle_tracking.js hands each death's on to
// the missions and the Primaries), and every rule that answers a destroyed unit -
// a kill trigger ("each time this unit destroys an enemy unit"), a pool fed by
// friendly losses, an Omen of a friendly death - answers the pair once
// (pairDestructionAnswered). A pair whose CHARACTER fell in one activation and its
// squad in a later one is two units destroyed, as a destroyed CHARACTER is a
// destroyed unit.
//
// The window is the ACTIVATION (the user, 2026-10-29: "if the pair is killed in a
// single activation then yeah"): two attacks of one activation, or an attack and a
// failed Fall Back's damage, are one. It is the activation the engine numbers for
// one Morale Test per activation (G.unitActivationSeq, phases/flow/unit_activation.js),
// with its Battle Round and phase. A Reaction belongs to the activation it answers,
// since the number moves only when a turn passes or a phase ends. Outside the
// Movement and Action Phases' activations a death belongs to the turn it falls in
// (a Command Phase turn), or to the phase's end (the end of a phase, the Cleanup
// Phase's checkpoints): each of those is one window.

// The moment a death belongs to: the activation, in its phase and Battle Round.
function _pairDeathMoment() {
  return G.round + ':' + G.battlePhase + ':' + G.unitActivationSeq;
}
'''),
  ('''// How `unit`'s death is counted: { key, together } - `together` when it is the second
// death of a pair destroyed together, already counted under `key`. Asked once per
// death, before the death ends the pair (applyUnitDestruction).
function destructionCount(unit) {
  if (isJoined(unit)) {
    var key = destructionCountKey(unit);
    joinedPartner(unit)._pairDeath = { key: key, moment: _pairDeathMoment() };
    return { key: key, together: false };
  }
  var mark = unit._pairDeath;
  delete unit._pairDeath;
  if (mark && mark.moment === _pairDeathMoment()) return { key: mark.key, together: true };
  return { key: unit.uid, together: false };
}
''', '''// How `unit`'s death is counted: { key, together, answered } - `together` when it is
// the second death of a pair destroyed together, already counted under `key`; and,
// for a pair's death, `answered`: the rules that have answered the pair's destruction
// (pairDestructionAnswered), shared by both of its deaths. Asked once per death,
// before anything answers it and before the death ends the pair
// (applyUnitDestruction).
function destructionCount(unit) {
  if (isJoined(unit)) {
    var key = destructionCountKey(unit);
    var answered = {};
    joinedPartner(unit)._pairDeath = { key: key, moment: _pairDeathMoment(), answered: answered };
    return { key: key, together: false, answered: answered };
  }
  var mark = unit._pairDeath;
  delete unit._pairDeath;
  if (mark && mark.moment === _pairDeathMoment()) {
    return { key: mark.key, together: true, answered: mark.answered || {} };
  }
  return { key: unit.uid, together: false };
}

// Has the rule `answerer` (a name unique to the rule and its holder) already answered
// the destruction `counted` (destructionCount) stands for? Records that it has when
// not. Only a pair's destruction is remembered: a rule answers it once, at the first
// of its deaths that the rule's own conditions accept - so a rule about a destroyed
// CHARACTER still answers a pair whose squad fell first. Any other death is answered
// each time.
function pairDestructionAnswered(counted, answerer) {
  if (!counted || !counted.answered) return false;
  if (counted.answered[answerer]) return true;
  counted.answered[answerer] = true;
  return false;
}
'''),
 ],
 'engine/modules/combat/battle_tracking.js': [
  ('''  var dCol = deathCtx.deathCol != null ? deathCtx.deathCol : target.col;
  var dRow = deathCtx.deathRow != null ? deathCtx.deathRow : target.row;
  return ruleThen(runDeathRetaliateTriggers(deathCtx, logFn), function() {
  return ruleThen(runDeathEffectTriggers(deathCtx, logFn), function() {''',
   '''  var dCol = deathCtx.deathCol != null ? deathCtx.deathCol : target.col;
  var dRow = deathCtx.deathRow != null ? deathCtx.deathRow : target.row;
  // How the death counts, asked while a pair still stands and before anything answers
  // it: a pair destroyed together is one unit destroyed (core/joined_units.js), for the
  // counters below and for every rule that answers the death (`destruction`).
  var counted = destructionCount(target);
  return ruleThen(runDeathRetaliateTriggers(deathCtx, logFn), function() {
  return ruleThen(runDeathEffectTriggers(deathCtx, logFn), function() {'''),
  ('''  return ruleThen(fireAbilityEvent('unit_destroyed', { unit: target, attacker: killerUnit && killerUnit !== target ? killerUnit : null,
    deathCol: dCol, deathRow: dRow, deadPlayer: target.player }), function() {''',
   '''  return ruleThen(fireAbilityEvent('unit_destroyed', { unit: target, attacker: killerUnit && killerUnit !== target ? killerUnit : null,
    deathCol: dCol, deathRow: dRow, deadPlayer: target.player, destruction: counted }), function() {'''),
  ('''  return ruleThen(fireAbilityEvent('ally_destroyed', {
    deadUnit: target, killerUnit: killerUnit || null,
    deathCol: dCol, deathRow: dRow, deadPlayer: target.player,
  }), function() {''',
   '''  return ruleThen(fireAbilityEvent('ally_destroyed', {
    deadUnit: target, killerUnit: killerUnit || null,
    deathCol: dCol, deathRow: dRow, deadPlayer: target.player, destruction: counted,
  }), function() {'''),
  ('''      kind: deathCtx.attackKind || (source === 'melee' ? 'melee' : null),
      deathCol: dCol, deathRow: dRow, deadPlayer: target.player,
    }) : null, function() {
  // A face-dice event (core/face_dice/triggers.js; the League's first Omen).
  faceDiceObserve('unit_destroyed', target);
  // Any resource pool that gains when a friendly unit falls (Martyred Blood).
  awardResourcePoolsForUnitDestroyed(target, {
    reason: 'friendly unit destroyed',
    killerPlayer: killerPlayer,
    killerUnit: killerUnit || null,
    source: source || 'normal',
  });''',
   '''      kind: deathCtx.attackKind || (source === 'melee' ? 'melee' : null),
      deathCol: dCol, deathRow: dRow, deadPlayer: target.player, destruction: counted,
    }) : null, function() {
  // A face-dice event (core/face_dice/triggers.js; the League's first Omen).
  faceDiceObserve('unit_destroyed', target, counted);
  // Any resource pool that gains when a friendly unit falls (Martyred Blood).
  awardResourcePoolsForUnitDestroyed(target, {
    reason: 'friendly unit destroyed',
    killerPlayer: killerPlayer,
    killerUnit: killerUnit || null,
    source: source || 'normal',
    destruction: counted,
  });'''),
  ('''  target.destroyedRound = G.round ? G.round : 1;
  // How the death counts, asked while a pair still stands: a pair destroyed
  // together is one unit destroyed (core/joined_units.js).
  var counted = destructionCount(target);
  // A joined pair ends''',
   '''  target.destroyedRound = G.round ? G.round : 1;
  // A joined pair ends'''),
 ],
}
for p, pairs in edits.items():
    path = os.path.join(ROOT, p)
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70])
        s = s.replace(old, new)
    open(path, 'w').write(s)
print('ok')
