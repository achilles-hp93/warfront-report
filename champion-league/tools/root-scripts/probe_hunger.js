(function() {
  var out = [];
  function one(level, melee) {
    return _withCleanBoard(function() {
      G.playerFactions = ['golden_khaganate', 'iron_imperium'];
      G.players[0].factionId = 'golden_khaganate';
      G.round = 3; G.battlePhase = 'ACTION'; G.activePlayer = 0;
      var a = _place(createUnit('golden_khaganate:stormrider', 0), 5, 5);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), melee ? 6 : 7, 5);
      a.flags.hunger = level; a.ap = 1; a.usedAction = false; a.attacked = false;
      var seen = [];
      var savedOn = unitResourcesOnAttack;
      unitResourcesOnAttack = function(u) { seen.push('reset@' + unitResourceValue(u, 'hunger')); return savedOn(u); };
      var savedRoll = rollDie, n = 0;
      rollDie = function() { n++; return 6; };
      var savedTag = Weapons.profile;
      try {
        AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
        var plan = _aiPickBestCompositionAttack(a, foe); if (!plan) return { why: canAttack(a, foe), w: Weapons.groups(a, melee ? "melee" : "ranged").map(function(g){return g.weapon.name;}) };
        var act = _aiCandidateAction({ type: plan.type, unit: a, target: foe, groups: plan.groups, square: plan.square }, 0);
        var groups = plan.groups.map(function(g) { return g.weapon && (g.weapon.name + ' fr=' + g.weapon.fr + ' ar=' + g.weapon.ar + ' ap=' + g.weapon.ap); });
        var r = executeRegisteredAction(act); var guard = 0; var ij = []; while (G.pendingInterjection && guard++ < 6) { ij.push(G.pendingInterjection.seamId); passInterjection({ skipRecord: true }); } r.ij = ij;
        return { level: level, melee: !!melee, plan: plan.type, groups: groups, dice: n, seen: seen, after: unitResourceValue(a, 'hunger'), ij: r.ij, log: G.combatLog.slice(-6).map(function(e){return typeof e === 'string' ? e : (e.text || e.msg || JSON.stringify(e)).slice(0,160);}) };
      } finally { rollDie = savedRoll; unitResourcesOnAttack = savedOn; }
    });
  }
  out.push(one(4, false)); out.push(one(5, false));

  return out;
})()
