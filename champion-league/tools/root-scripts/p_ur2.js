(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { round: G.round, bp: G.battlePhase };
    G.round = 2; G.battlePhase = 'ACTION';
    try {
      ensureCombatEffectsFromData();
      out.keys = Object.keys(COMBAT_EFFECTS).filter(function(k){ return /universal|saddle/.test(k); });
      var rider = _place(createUnit('golden_khaganate:stormrider', 0), 7, 8);
      var foe = _place(createUnit('infernal_congregations:furyforged_berserkers', 1), 7, 7);
      markFellBackFrom(rider); placeFootprint(rider, 7, 11);
      markRound(rider, 'universal_ruler');
      var ctx = { domain: 'ranged', attacker: rider, defender: foe, target: foe };
      out.collected = collectCombatEffects(ctx).filter(function(k){ return /universal|saddle/.test(k); });
      var h = COMBAT_EFFECTS[out.keys.filter(function(k){ return /universal/.test(k); })[0]];
      out.handler = h ? { domain: h.domain, hooks: Object.keys(h).filter(function(k){ return typeof h[k] === 'function'; }), applies: h.applies ? String(h.applies(ctx)) : 'none' } : null;
      out.hasMark = CONDITIONAL_MOD_PREDICATES.has_round_mark(rider, { key: 'universal_ruler' });
      out.fellBack = COMBAT_PREDICATES.attackerFellBackFromDefender(ctx);
      out.riderFaction = rider.faction || rider.factionId || (rider.templateId || '').split(':')[0];
    } finally { G.round = saved.round; G.battlePhase = saved.bp; }
  });
  return out;
})()
