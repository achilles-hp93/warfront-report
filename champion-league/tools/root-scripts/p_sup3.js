(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { phase: G.phase, bp: G.battlePhase, round: G.round, active: G.activePlayer, player: AI.player };
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 0; AI.player = 0; G.objectives = [];
    try {
      var shaman = _place(createUnit('golden_khaganate:black_shaman', 0), 4, 10);
      var rider = _place(createUnit('golden_khaganate:stormrider', 0), 6, 10);
      var foe = _place(createUnit('iron_imperium:ironthunder_vanguard', 1), 6, 5);
      foe.intelLevel = [1, 1];
      var chant = getRiteById('chant_of_the_kindling');
      var read = function() {
        return Weapons.groups(rider, 'ranged').map(function(g) {
          var e = expectedRangedCasualties(rider, foe, g.weapon, g.modelCount);
          return { name: g.weapon.name, count: g.modelCount, fr: g.weapon.fr, dmg: g.weapon.dmg, ap: g.weapon.ap, e: e };
        });
      };
      out.without = read();
      out.with = withModifiersAside(rider, function(u){ chant.effects.forEach(function(e){ runOp(e, { unit: shaman, targets: [u], source: chant.name, sourceName: chant.name }); }); }, read);
      out.def = Stats.defense(foe, {}).value;
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.activePlayer = saved.active; AI.player = saved.player; }
  });
  return out;
})()
