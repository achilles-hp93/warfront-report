(function(){
  var out = {};
  _withCleanBoard(function(){
    var u = _place(createUnit('principality_of_novgorod:bogatyr_thunderguards', 0), 7, 12);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 7);
    out.effectsRanged = collectCombatEffects({ attacker: u, defender: foe, domain: 'ranged' }).filter(function(id){ return /svyat|bogat|oath/.test(id); });
    out.def = COMBAT_EFFECTS.svyatogors_weight ? Object.keys(COMBAT_EFFECTS.svyatogors_weight) : null;
    var ctx = { attacker: u, defender: foe, hitMod: 0, effects: ['svyatogors_weight'] };
    fireCombatHook('modifyThreshold', ctx); out.hitModStanding = ctx.hitMod;
    u.moved = true; ctx.hitMod = 0; fireCombatHook('modifyThreshold', ctx); out.hitModMoved = ctx.hitMod; u.moved = false;
  });
  return out;
})()
