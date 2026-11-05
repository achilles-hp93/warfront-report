(function() {
  var out = {};
  _withCleanBoard(function() {
    G.playerFactions = ['golden_khaganate', 'iron_imperium'];
    G.players[0].factionId = 'golden_khaganate';
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 3; G.activePlayer = 0; G.objectives = [];
    ensureFantasyMagicState(); G.mana = [10, 10];
    var shaman = _place(createUnit('golden_khaganate:black_shaman', 0), 4, 4);
    var rider = _place(createUnit('golden_khaganate:stormrider', 0), 6, 4);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 4);
    [shaman, rider].forEach(function(u) { u.ap = 1; u.moved = false; u.attacked = false; u.usedAction = false; });
    var chant = getRiteById('chant_of_the_kindling');
    var effect = chant.effects[0];
    out.holds = { shaman: unitHoldsResource(shaman, 'hunger'), rider: unitHoldsResource(rider, 'hunger') };
    var reset = function() { AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache(); };
    var levels = [0, 1, 2, 3, 4];
    out.adjacent = levels.map(function(l) {
      rider.flags.hunger = l; reset();
      return { l: l, chance: aiUnitAttackChance(rider, 'any', { actor: shaman }), worth: aiResourceRaiseWorth(shaman, effect, rider), score: _aiScoreRiteOnUnit(shaman, chant, rider), atk: aiUnitAttackWorth(rider) };
    });
    rider.ap = 0;
    out.spent = levels.map(function(l) {
      rider.flags.hunger = l; reset();
      return { l: l, worth: aiResourceRaiseWorth(shaman, effect, rider) };
    });
    markRound(rider, 'last_attack');
    out.attackedThisRound = levels.map(function(l) {
      rider.flags.hunger = l; reset();
      return { l: l, worth: aiResourceRaiseWorth(shaman, effect, rider) };
    });
    clearRoundMark(rider, 'last_attack');
    rider.ap = 1;
    G.unitResourceResetSoftened = { 0: { hunger: G.round } };
    out.softened = levels.map(function(l) {
      rider.flags.hunger = l; reset();
      return { l: l, worth: aiResourceRaiseWorth(shaman, effect, rider) };
    });
    G.unitResourceResetSoftened = null;
    rider.flags.hunger = 1; reset();
    var cands = _aiCollectActions(shaman).map(function(c) { return c.type + ':' + (c.rite ? c.rite.id : '') + '->' + (c.target && c.target.name) + ' ' + c.score.toFixed(3); });
    out.shamanCands = cands;
    out.shamanHunger = unitResourceValue(shaman, 'hunger');
  });
  return out;
})()
