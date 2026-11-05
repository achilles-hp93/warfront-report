(function(){
  var out = {};
  _withCleanBoard(function(){
    var u = _place(createUnit('principality_of_novgorod:bogatyr_thunderguards', 0), 7, 12);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 7);
    var w = Weapons.groups(u, 'ranged')[1].weapon;
    var read = function(){
      var opts = getWeaponOpts(u, w, foe); opts.rangedAttack = true;
      var rw = opts.weapon || w;
      var seed = _ecRangedHitSeed(u, foe, rw, opts);
      var ctx = _ecRangedContext(u, foe, rw, opts, seed.threshold, seed.crit, 2, 3);
      var ch = _ecRangedHit(u, foe, rw, opts, ctx, seed);
      var full = expectedRangedCasualties(u, foe, w, 2, null, null);
      return { ch: ch, fullHits: full.hits, dice: full.dice };
    };
    out.standing = read();
    u.moved = true; out.moved = read(); u.moved = false;
  });
  return out;
})()
