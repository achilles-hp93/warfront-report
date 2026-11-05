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
      addMana(0, 10);
      var before = JSON.stringify([rider._modifiers, rider.mods, rider.activeMods, Models.all(rider).map(function(m){ return [m._modifiers, m.mods, m.activeMods, m.hp]; }), rider.tags]);
      var chant = getRiteById('chant_of_the_kindling');
      _aiResetMoveEvalCache();
      out.gain = aiWithMoveEvalCache(function(){ return aiBuffAttackGain(shaman, chant.effects, rider, chant.name); });
      out.value = aiWithMoveEvalCache(function(){ return aiFriendlyBuffValue(shaman, chant.effects, rider, { source: chant.name }); });
      var after = JSON.stringify([rider._modifiers, rider.mods, rider.activeMods, Models.all(rider).map(function(m){ return [m._modifiers, m.mods, m.activeMods, m.hp]; }), rider.tags]);
      out.restored = before === after;
      var choice = aiChooseActionPhase(0);
      var b = choice.best;
      out.choice = b && { type: b.type, unit: b.unit.name, target: b.target && b.target.name, score: b.score, rite: b.rite && b.rite.name };
      _aiResetMoveEvalCache();
      out.cands = aiWithMoveEvalCache(function(){ return [shaman, rider].map(function(u){ return _aiCollectActions(u).map(function(c){ return [u.name, c.type, c.target && c.target.name, Math.round(c.score*10)/10, aiCandidateIsSupport(c)]; }); }); });
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.activePlayer = saved.active; AI.player = saved.player; }
  });
  return out;
})()
