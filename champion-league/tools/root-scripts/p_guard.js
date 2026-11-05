(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { phase: G.phase, bp: G.battlePhase, round: G.round, active: G.activePlayer, player: AI.player };
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 0; AI.player = 0; G.objectives = [];
    try {
      var caster = _place(createUnit('iron_imperium:legionnaire_squad', 0), 13, 1);
      var friend = _place(createUnit('iron_imperium:legionnaire_squad', 0), 5, 5);
      var far = _place(createUnit('iron_imperium:legionnaire_squad', 0), 13, 13);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 5, 9);
      [friend, far, caster].forEach(function(u){ u.intelLevel = [1,1]; u.ap = 1; });
      foe.intelLevel = [1, 1]; foe.ap = 1;
      var aegis = getRiteById('aegis_imperialis');
      var held = function(u) { return JSON.stringify([u._modifiers, u.mods, u.activeMods, u.tags, Models.all(u).map(function(m){ return [m._modifiers||null, m.mods||null, m.activeMods||null, m.hp]; })]); };
      var before = held(friend);
      var run = function(fn) { _aiResetMoveEvalCache(); return aiWithMoveEvalCache(fn); };
      var farAt = [far.col, far.row]; far.col = -1; far.row = -1; caster.col = -1; caster.row = -1;
      out.dbg = run(function(){ return { rows: _aiGuardThreats(foe, 0).map(function(r){ return [r.unit.uid, r.unit.col, r.unit.row, r.taken]; }), friend: friend.uid, prevented: aiGuardPrevented(caster, aegis.effects, friend, aegis.name), guards: aegis.effects.map(aiEffectGuards), dom: aegis.effects.map(function(e){ return aiEffectAttackDomain(e, friend); }) }; });
      out.onFriend = run(function(){ return aiFriendlyBuffValue(caster, aegis.effects, friend, { source: aegis.name }); });
      far.col = farAt[0]; far.row = farAt[1];
      out.onFar = run(function(){ return aiFriendlyBuffValue(caster, aegis.effects, far, { source: aegis.name }); });
      out.restored = held(friend) === before;
      far.col = -1; far.row = -1;
      foe.ap = 0;
      out.foeSpent = run(function(){ return aiFriendlyBuffValue(caster, aegis.effects, friend, { source: aegis.name }); });
      foe.ap = 1;
      var cross = [{ op: 'mod_hit_roll', amount: -1, applies_to: 'incoming', duration: 'this_round', target: 'target' }];
      out.crossDomain = aiEffectAttackDomain(cross[0], friend);
      out.cross = run(function(){ return aiFriendlyBuffValue(caster, cross, friend, { source: 'Probe Cross' }); });
      var inv = [{ op: 'mod_save', kind: 'invulnerable', value: 4, duration: 'this_round', target: 'target' }];
      out.inv = run(function(){ return aiFriendlyBuffValue(caster, inv, friend, { source: 'Probe Ward' }); });
      out.cmd = run(function(){ return aiCommandEffectValue(aegis.effects[0], friend, { player: 0, enemies: [foe] }); });
      out.cmdFar = run(function(){ return aiCommandEffectValue(aegis.effects[0], far, { player: 0, enemies: [foe] }); });
      out.restored2 = held(friend) === before;
      out.foeOnFriend = run(function(){ return aiRoundAttack(foe, friend).taken; });
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.activePlayer = saved.active; AI.player = saved.player; }
  });
  return out;
})()
