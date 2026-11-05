(function(){
  var out = {};
  _withCleanBoard(function(){
    var u = _place(createUnit('principality_of_novgorod:bogatyr_thunderguards', 0), 7, 12);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 7);
    foe.intelLevel = [2,2];
    var g = Weapons.groups(u, 'ranged')[1];
    var one = function(){ return expectedRangedCasualties(u, foe, g.weapon, g.modelCount, null, null); };
    u.moved = true; var mv = one(); u.moved = false; var st = one();
    out.movedFirst = { hits: mv.hits, keys: Object.keys(mv) };
    out.standingAfter = { hits: st.hits };
    out.stHitChance = st.hitChance || st.pHit || null;

  });
  return out;
})()
