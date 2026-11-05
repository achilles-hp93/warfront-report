(function() {
  return _whOverdrawBoard(function() {
    var witch = _whStormWitch(0);
    _place(createUnit('iron_imperium:legionnaire_squad', 1), 5, getBoardDimensions().rows - 2);
    var overdraw = witch.abilities.find(function(a) { return (a.abilityId || a.id) === 'overdraw'; });
    G.mana = [0, 0];
    var eff = (_findAbility(witch, overdraw.name) || {}).effects;
    return { use: _aiScoreAbilityUse(witch, overdraw, null), bank: _aiScoreManaBankingAbility(witch, _findAbility(witch, overdraw.name)),
      each: aiManaWorthEach(witch), self: aiEffectsSelfDamage(witch, eff), cost: aiSelfDamageCost(witch, aiEffectsSelfDamage(witch, eff)),
      tv: aiTargetValue(witch), hp: Stats.health(witch).current, total: _aiScoreAbility(witch, overdraw, null), pool: aiAbilityPoolCostValue(witch, overdraw) };
  });
})();
