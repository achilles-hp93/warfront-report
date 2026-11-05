(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { phase: G.phase, bp: G.battlePhase, round: G.round, active: G.activePlayer, player: AI.player };
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 0; AI.player = 0; G.objectives = [];
    try {
      var genghis = _place(createUnit('golden_khaganate:genghis_khan', 0), 2, 12);
      var rider = _place(createUnit('golden_khaganate:stormrider', 0), 7, 8);
      var foe = _place(createUnit('infernal_congregations:furyforged_berserkers', 1), 7, 7);
      foe.intelLevel = [1, 1];
      markFellBackFrom(rider);
      placeFootprint(rider, 7, 11);
      genghis.ap = 1; rider.ap = 1;
      out.fellBack = fellBackFrom(rider, foe);
      var ab = (genghis.abilities || []).find(function(a){ return /Universal Ruler/.test(a.name || ''); });
      out.ability = ab && { name: ab.name, phase: ab.phase, effects: (ab.effects||[]).map(function(e){ return e.op; }) };
      _aiResetMoveEvalCache();
      out.opScore = aiAbilityOpScore(genghis, ab);
      _aiResetMoveEvalCache();
      out.fullScore = _aiScoreAbility(genghis, ab, null);
      var plain = aiUnitAttackWorth(rider);
      markRound(rider, 'universal_ruler');
      _aiResetMoveEvalCache();
      var marked = _aiWithScratchMoveEvalCache(function(){ return aiUnitAttackWorth(rider); });
      clearRoundMark(rider, 'universal_ruler');
      out.riderWorth = { plain: plain, marked: marked };
      var shotPlain = _aiRangedDamageEstimate(rider, foe);
      markRound(rider, 'universal_ruler');
      var shotMarked = rulesReadingAside(function(){ return _aiRangedDamageEstimate(rider, foe); });
      clearRoundMark(rider, 'universal_ruler');
      out.shot = { plain: shotPlain, marked: shotMarked };
      _aiResetMoveEvalCache();
      out.genghisBestAttack = aiUnitAttackWorth(genghis);
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.activePlayer = saved.active; AI.player = saved.player; }
  });
  return out;
})()
