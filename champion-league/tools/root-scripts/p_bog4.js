(function(){
  var out = {};
  _withCleanBoard(function(){
    var u = _place(createUnit('principality_of_novgorod:bogatyr_thunderguards', 0), 7, 12);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 7);
    var w = Weapons.groups(u, 'ranged')[1].weapon;
    var read = function(tag){
      return rulesReadingAside(function(){
        var opts = getWeaponOpts(u, w, foe); opts.rangedAttack = true;
        var rw = opts.weapon || w;
        var seed = _ecRangedHitSeed(u, foe, rw, opts);
        var ctx = _ecRangedContext(u, foe, rw, opts, seed.threshold, seed.crit, 2, 3);
        fireCombatHook('modifyThreshold', ctx);
        var baseMod = effectiveHitMod(u, foe, opts);
        return { tag: tag, threshold: seed.threshold, acc: ctx.accThreshold, hookMod: ctx.hitMod, baseMod: baseMod,
          capped: hitRollModifierAgainst(foe, baseMod + ctx.hitMod), effects: ctx.effects.length, sustained: opts.sustainedAttack, rerolls: JSON.stringify(hitRerollPermissions(u, foe, 'ranged', Object.assign({}, opts, { weapon: rw }))) };
      });
    };
    out.standing = read('standing');
    u.moved = true; out.moved = read('moved'); u.moved = false;
  });
  return out;
})()
