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
      shaman.ap = 1; rider.ap = 1;
      out.foe = Models.alive(foe).map(function(m){ return m.hp; });
      out.foeValue = aiTargetValue(foe);
      var chant = getRiteById('chant_of_the_kindling');
      var read = function() {
        var plan = _aiPickBestCompositionAttack(rider, foe);
        var det = expectedGroupsCasualtyDetail(rider, foe, plan.groups, 'ranged');
        return { score: plan.score, hp: det.hpRemoved, kills: det.modelsKilled, dmg: Weapons.groups(rider,'ranged').map(function(g){ return g.weapon.dmg; }) };
      };
      out.without = _aiWithScratchMoveEvalCache(read);
      out.with = _aiWithScratchMoveEvalCache(function(){ return withModifiersAside(rider, function(u){ chant.effects.forEach(function(e){ runOp(e, { unit: shaman, targets: [u], source: chant.name, sourceName: chant.name }); }); }, read); });
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.activePlayer = saved.active; AI.player = saved.player; }
  });
  return out;
})()
