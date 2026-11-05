(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { phase: G.phase, bp: G.battlePhase, round: G.round, active: G.activePlayer, player: AI.player };
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 0; AI.player = 0; G.objectives = [];
    try {
      var caster = _place(createUnit('iron_imperium:legionnaire_squad', 0), 2, 5);
      var friend = _place(createUnit('iron_imperium:legionnaire_squad', 0), 5, 5);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 5, 9);
      [friend, caster].forEach(function(u){ u.intelLevel = [1,1]; u.ap = 1; });
      foe.intelLevel = [1, 1]; foe.ap = 1;
      var aegis = getRiteById('aegis_imperialis');
      _aiResetMoveEvalCache();
      aiWithMoveEvalCache(function(){
        out.chance = aiUnitAttackChance(foe, 'any');
        out.bestNow = _aiBestAttackDomainNow(foe);
        out.pick = (function(){ var p = _aiPickBestCompositionAttack(foe, friend); return p && { type: p.type, score: p.score }; })();
        out.rows = _aiGuardThreats(foe, 0).map(function(r){ return [r.unit.name, r.taken]; });
        out.guarded = aiWithBuffOn(caster, aegis.effects, friend, aegis.name, function(){ return aiRoundAttack(foe, friend).taken; });

      });
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.activePlayer = saved.active; AI.player = saved.player; }
  });
  return out;
})()
