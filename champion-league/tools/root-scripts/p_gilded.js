(function() {
  var out = {};
  _withCleanBoard(function() {
    G.round = 2; G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.activePlayer = 0;
    G.players = [
      { factionId: 'runeforge_directorate', doctrineId: 'gilded_ledger', cp: 10, commandsIssuedThisPhase: 0, commandsUsedThisPhase: [], flags: {} },
      { factionId: 'atashid_empire', doctrineId: null, cp: 0, commandsIssuedThisPhase: 0, commandsUsedThisPhase: [], flags: {} },
    ];
    G.loots = [20, 0];
    var hq = _place(createUnit('hq', 0, true), 0, 0);
    hq.isHQ = true;
    hq.commands = getAvailableHQCommands(0);
    for (var i = 0; i < 3; i++) {
      var friendly = _place(createUnit('runeforge_directorate:corporaider_squad', 0), 1, i + 1);
      friendly.ap = 1;
      var enemy = _place(createUnit('atashid_empire:shieldbearers', 1), 4, i + 1);
      enemy.intelLevel = { 0: 1, 1: 0 };
    }
    var cmd = hq.commands.filter(function(c) { return c.name === 'Liquidate Assets'; })[0];
    var ctx = { player: 0, cmd: cmd, friendlies: G.units.filter(function(u) { return u.player === 0; }), enemies: G.units.filter(function(u) { return u.player === 1; }) };
    [10, 12, 15, 20, 25, 30, 40].forEach(function(l) {
      G.loots[0] = l;
      _aiResetMoveEvalCache();
      var surge = aiCommandEffectValue(cmd.effects[0], null, ctx);
      _aiResetMoveEvalCache();
      var cost = aiPoolCostValue(cmd.resource.cost, 0, 'command');
      _aiResetMoveEvalCache();
      out['loots' + l] = { surge: surge, cost: cost, weight: _aiGenericCommandWeight(0, cmd, null, ctx) };
    });
    G.loots[0] = 20;
    _aiResetMoveEvalCache();
    var ht = hq.commands.filter(function(c) { return c.name === 'Hostile Takeover'; })[0];
    out.ht = ctx.friendlies.filter(function(u) { return !u.isHQ; }).map(function(u) { _aiResetMoveEvalCache(); return [aiExpectedKillsThisRound(u), aiCommandEffectValue(ht.effects[0], u, ctx)]; });
    _aiClearMoveEvalCache();
  });
  return out;
})()
