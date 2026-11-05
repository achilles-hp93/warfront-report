// Collect all castRite candidates for a caster. Returns [] for non-casters. Each
// rite's plain cast, and for a rite with an Oversoul cost its Oversoul cast, net of
// the Mana it costs over the plain one; at a target both can take, the one worth
// more (ai/action/rite_casts.js).
function _aiCollectRiteActions(caster) {
  if (!caster) return [];
  // One scoring pass, cached across it (aiWithMoveEvalCache), whoever asks.
  if (!_aiMoveEvalCache()) return aiWithMoveEvalCache(function() { return _aiCollectRiteActions(caster); });
  var rites = getAvailableRites(caster);
  if (!rites || !rites.length) return [];
  var out = [];
  rites.forEach(function(rite) {
    if (!rite) return;
    var plain = aiRiteCastCandidates(caster, rite, {});
    out = out.concat(aiBetterRiteCasts(plain, aiOversoulRiteCandidates(caster, rite)));
  });
  return out;
}

// Can the caster pay for this cast of the rite aimed at `target` - the price the
// cast itself charges (its Oversoul cost, for an Oversoul cast), the target's
// surcharge included?
function _aiCanAffordRiteAt(caster, rite, target, cast) {
  return getMana(caster.player) >= effectiveRiteManaCost(caster, rite, Object.assign({}, cast || {}, { target: target }));
}
