(function(){
  var out = {};
  _withCleanBoard(function(){
    var u = _place(createUnit('principality_of_novgorod:bogatyr_thunderguards', 0), 7, 12);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 7);
    foe.intelLevel = [2,2];
    var groups = Weapons.groups(u, 'ranged') || [];
    out.groups = groups.map(function(g){ return { key: g.weapon && g.weapon.key, bs: g.bs, n: g.modelCount, range: g.weapon && g.weapon.range }; });
    var hits = function(){ return groups.reduce(function(s, g){ var r = expectedRangedCasualties(u, foe, g.weapon, g.modelCount, null, null); return s + r.hits; }, 0); };
    out.standing = hits();
    out.moved = withFootprintMoved(u, hits);
    out.penalty = _aiWithScratchMoveEvalCache(function(){ return _aiMoveFirePenalty(u); });
    out.abilities = (u.abilities||[]).map(function(a){ return a.abilityId || a.id || a.name; });
    out.hasNotMoved = CONDITIONAL_MOD_PREDICATES.has_not_moved(u);
    out.hasEffect = !!COMBAT_EFFECTS['svyatogors_weight'];
  });
  return out;
})()
