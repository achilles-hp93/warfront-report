(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { round: G.round, bp: G.battlePhase };
    G.round = 2; G.battlePhase = 'ACTION';
    try {
      var rider = _place(createUnit('golden_khaganate:stormrider', 0), 7, 8);
      var foe = _place(createUnit('infernal_congregations:furyforged_berserkers', 1), 7, 7);
      foe.intelLevel = [1, 1];
      markFellBackFrom(rider); placeFootprint(rider, 7, 11);
      var w = Weapons.groups(rider, 'ranged')[0];
      var read = function(tag) {
        var opts = getWeaponOpts(rider, w.weapon, foe);
        var e = expectedGroupsCasualties(rider, foe, Weapons.groups(rider, 'ranged'), 'ranged');
        return { tag: tag, fr: opts.fr, dmg: opts.dmg != null ? opts.dmg : (opts.weapon && opts.weapon.dmg), ap: opts.armorPiercing, hp: e, profileFR: Weapons.profile(rider, null, w.weapon, { target: foe, preview: true }).fr };
      };
      markRound(rider, 'universal_ruler');
      out.markedFirst = read('marked first');
      clearRoundMark(rider, 'universal_ruler');
      out.plainAfter = read('plain after');
      markRound(rider, 'universal_ruler');
      out.markedAgain = read('marked again');
    } finally { G.round = saved.round; G.battlePhase = saved.bp; }
  });
  return out;
})()
