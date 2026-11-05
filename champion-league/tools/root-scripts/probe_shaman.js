(function() {
  var out = {};
  _withCleanBoard(function() {
    G.playerFactions = ['golden_khaganate', 'iron_imperium'];
    G.players[0].factionId = 'golden_khaganate';
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 3; G.activePlayer = 0; G.objectives = [];
    ensureFantasyMagicState(); G.mana = [10, 10];
    var shaman = _place(createUnit('golden_khaganate:black_shaman', 0), 5, 5);
    var rider = _place(createUnit('golden_khaganate:stormrider', 0), 5, 6);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 6, 6);
    [shaman, rider].forEach(function(u) { u.ap = 1; u.moved = false; u.attacked = false; u.usedAction = false; });
    var reset = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
    [0, 1, 2, 3].forEach(function(l) {
      shaman.flags.hunger = l; rider.flags.hunger = 0; reset();
      out['shaman' + l] = aiWithMoveEvalCache(function() {
        var p = _aiPickBestCompositionAttack(shaman, foe); var tag = 'raw=' + (p ? p.type + ' ' + p.score.toFixed(3) : 'none') + ' can=' + JSON.stringify(canAttack(shaman, foe)) + ' groups=' + Weapons.groups(shaman, 'melee').map(function(g){ return g.weapon.name + ' ' + JSON.stringify(canMeleeAttack(shaman, foe, g.weapon)); }).join(';'); return [tag].concat(_aiCollectActions(shaman).map(function(c) { return c.type + ':' + (c.rite ? c.rite.id : '') + '->' + (c.target && c.target.name) + ' ' + c.score.toFixed(3); }));
      });
    });
  });
  return out;
})()
