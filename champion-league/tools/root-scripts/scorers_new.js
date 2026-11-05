// Score a rite cast on a specific unit target.
function _aiScoreRiteOnUnit(caster, rite, target, cast) {
  if (!target || !target.alive) return -Infinity;
  var mode = _aiRiteCastMode(rite, cast);
  var effects = _aiRiteCastEffects(rite, cast);
  var friendlyTarget = mode.indexOf('friendly') === 0 || target.player === caster.player;
  var enemyTarget = mode.indexOf('enemy') === 0 || target.player !== caster.player;

  // 1. OFFENSIVE - direct damage on an enemy: reuse the attack currency. The
  // target at what the rite is expected to take off it, with the kill bonus;
  // every other unit its damage reaches as the AI prices a blast's splash; and
  // what its other effects do to the target as a debuff (Judgment of Ma'at's
  // Oversoul: the BS and MS it takes beside its damage).
  if (_aiRiteHasDamage(rite, cast) && enemyTarget) {
    var damage = _aiRiteDamage(caster, rite, target, cast);
    var eDmg = damage.hpOn(target);
    var score = eDmg * _aiRiteTargetValue(target);
    if (eDmg >= _aiCurrentHP(target) && aiW('KILL_BONUS_MULTIPLIER')) {
      score *= aiW('KILL_BONUS_MULTIPLIER');
    }
    var others = effects.filter(function(e) { return !effectDealsDamage(e); });
    return score + aiEffectsDamageWorth(caster, damage, target) + AI_RITE_WEIGHTS.OFFENSIVE_BIAS
      + (others.length ? _aiRiteDebuffValue(caster, others, target) : 0);
  }

  // 2. HEAL - the HP its effects put back on each friend they reach
  // (ai/action/heal_value.js); never cast on a unit every heal of it would refuse.
  if (friendlyTarget && _aiRiteHasHeal(rite, cast)) {
    var heals = effects.filter(function(e) { return e && e.op === 'heal'; });
    if (heals.length && heals.every(function(e) { return healRefusal(e, target); })) return -Infinity;
    return aiHealValue(caster, { id: rite.id, effects: effects }, target);
  }

  // 3. BUFF - on a friendly: the share of it each friend its effects reach will use
  // (ai/action/buff_value.js); a rite of no buff the AI knows, by the ally's
  // engagement as before.
  if (friendlyTarget) {
    var buff = _aiRiteFriendsBuffValue(caster, rite, target, cast);
    if (buff != null) return buff;
    var mult = _aiAnyEnemyWithin(target, AI_RITE_WEIGHTS.ENGAGE_RANGE) ? 1 : AI_BUFF_IDLE;
    return _aiRiteTargetValue(target) * aiW('W_BUFF') * mult;
  }

  // 4. DEBUFF - non-damaging effect on an enemy.
  if (enemyTarget) return _aiRiteDebuffValue(caster, effects, target);

  return -Infinity;
}

// What `effects` do to the enemy `target` as a debuff: an effect the AI can price is
// worth what it does (AI_RITE_DEBUFF_PRICERS), any other the target's threat (once).
function _aiRiteDebuffValue(caster, effects, target) {
  var priced = 0;
  var unpriced = false;
  effects.forEach(function(effect) {
    var pricer = effect && AI_RITE_DEBUFF_PRICERS[effect.op];
    var value = pricer ? pricer(effect, target, caster.player, caster) : null;
    if (value == null) unpriced = true;
    else priced += value;
  });
  return priced + (unpriced ? _aiRiteThreatValue(target) * AI_RITE_WEIGHTS.DEBUFF_FACTOR : 0);
}

// What a friendly cast at `target` is worth as a buff: on each friend its effects
// reach, as the rules resolve them for the cast (resolveEffectTargets: Wadjet's Gaze's
// Oversoul reaches every friend beside the target, a cast on a squad its joined
// CHARACTER too), the buff those effects are to it (aiFriendlyBuffValue), less the HP
// its damage takes off friends (Blood Sacrifice's own price). Null when no effect is a
// buff the AI knows.
function _aiRiteFriendsBuffValue(caster, rite, target, cast) {
  var effects = _aiRiteCastEffects(rite, cast);
  var ctx = { unit: caster, ability: rite, target: target, opts: cast || {} };
  var friends = [];
  var reaching = {};
  effects.forEach(function(effect) {
    if (effectDealsDamage(effect)) return;
    resolveEffectTargets(caster, effect, target, ctx).forEach(function(u) {
      if (!u || !u.alive || u.player !== caster.player || u.uid == null) return;
      if (!reaching[u.uid]) { reaching[u.uid] = []; friends.push(u); }
      reaching[u.uid].push(effect);
    });
  });
  var worth = friends.reduce(function(sum, friend) {
    var value = aiFriendlyBuffValue(caster, reaching[friend.uid], friend, { source: rite.name });
    return value == null ? sum : (sum || 0) + value;
  }, null);
  if (worth == null || !_aiRiteHasDamage(rite, cast)) return worth;
  return worth + aiEffectsDamageWorth(caster, _aiRiteDamage(caster, rite, target, cast), null);
}

// Score a rite cast on a target square (AOE / summon / zone). A damaging one is
// worth what its effects are expected to do to every unit they reach, friend or
// foe; any other, the debuff on every enemy its effects reach, as the rules
// resolve them for the cast (aiEnemiesEffectsReach: each effect's own area, side
// and filters). Either way, a unit it summons is worth that unit to its side
// (aiEffectsSummonWorth: the unit the cast raises, its summon choice's), and a terrain
// or ELEVATION change what it does for the units that could stand on the square
// (aiEffectsGroundWorth).
function _aiScoreRiteSquare(caster, rite, square, cast) {
  if (!square) return -Infinity;
  var effects = _aiRiteCastEffects(rite, cast);
  var summoned = aiEffectsSummonWorth(caster, effects, square, cast);
  var ground = aiEffectsGroundWorth(caster, effects, square);
  var board = summoned + (ground || 0);
  if (_aiRiteHasDamage(rite, cast)) return aiEffectsDamageWorth(caster, _aiRiteDamage(caster, rite, square, cast), null) + board;
  var affected = aiEnemiesEffectsReach(caster, effects, square, null,
    { unit: caster, ability: rite, target: square, opts: cast || {} });
  if (affected.length) {
    return affected.reduce(function(acc, e) {
      return acc + _aiRiteThreatValue(e) * AI_RITE_WEIGHTS.SQUARE_DEBUFF_FACTOR;
    }, board);
  }
  if (summoned > 0 || ground != null) return board;
  // Empty square (an altar, a zone): only worth it while enemies are near.
  return _aiAnyEnemyWithin(caster, AI_RITE_WEIGHTS.ENGAGE_RANGE + 2) ? AI_RITE_WEIGHTS.UTILITY_IDLE : -Infinity;
}

// Score a self / global rite (no target). One that deals damage (Cad Goddeu:
// every enemy in FOREST within 4) is worth what it is expected to do now to the
// units its effects reach, friends as a cost, and nothing when it hurts no enemy.
// One that brings units back from their markers (HTP-DI-NSW Formula: every friendly
// Soul Marker within 4) is worth what bringing them back now adds
// (aiEffectsResurrectWorth), and nothing when it brings none back.
function _aiScoreRiteSelf(caster, rite, cast) {
  if (rite && _aiRiteHasDamage(rite, cast)) {
    var damage = _aiRiteDamage(caster, rite, null, cast);
    return aiEffectsDamageEnemies(caster, damage)
      ? aiEffectsDamageWorth(caster, damage, null) + AI_RITE_WEIGHTS.OFFENSIVE_BIAS
      : -Infinity;
  }
  var raised = rite ? aiEffectsResurrectWorth(caster, _aiRiteCastEffects(rite, cast), null, cast) : null;
  if (raised != null) return raised > 0 ? raised : -Infinity;
  return _aiAnyEnemyWithin(caster, AI_RITE_WEIGHTS.ENGAGE_RANGE)
    ? AI_RITE_WEIGHTS.UTILITY_ENGAGED
    : AI_RITE_WEIGHTS.UTILITY_IDLE;
}

// Score a rite cast at a marker - or, an Oversoul cast, at several (Heka of the
// Eternal March). A damaging one as a square rite at the marker's square; one that
// brings the markers' units back by what that adds (aiEffectsResurrectWorth); any
// other as a utility.
function _aiScoreRiteMarker(caster, rite, markers, cast) {
  if (_aiRiteHasDamage(rite, cast)) return _aiScoreRiteSquare(caster, rite, [].concat(markers)[0], cast);
  var raised = aiEffectsResurrectWorth(caster, _aiRiteCastEffects(rite, cast), markers, cast);
  if (raised != null) return raised > 0 ? raised : -Infinity;
  return _aiScoreRiteSelf(caster, null, cast);
}
