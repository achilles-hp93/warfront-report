(function() {
  var out = {};
  _withCleanBoard(function() {
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.activePlayer = 0;
    G.players = [
      { factionId: 'runeforge_directorate', doctrineId: null, cp: 0, commandsIssuedThisPhase: 0, commandsUsedThisPhase: [], flags: {} },
      { factionId: 'duat_dominion', doctrineId: null, cp: 0, commandsIssuedThisPhase: 0, commandsUsedThisPhase: [], flags: {} },
    ];
    var rs = _place(createUnit('runeforge_directorate:runesmith', 0), 5, 5);
    var raiders = _place(createUnit('runeforge_directorate:corporaider_squad', 0), 5, 6);
    var maidens = _place(createUnit('runeforge_directorate:shieldmaidens', 0), 6, 5);
    var foe = _place(createUnit("duat_dominion:skeletal_spearman", 1), 5, 8);
    [rs, raiders, maidens, foe].forEach(function(u) { u.ap = 1; });
    [[1, 0], [1, 5], [3, 5], [5, 5]].forEach(function(rl) {
      G.round = rl[0]; G.loots = [rl[1], 0];
      AI._planRevision = (AI._planRevision || 0) + 1;
      _aiResetMoveEvalCache();
      var cands = _aiCollectActions(rs).map(function(c) {
        return [c.type, c.target && c.target.name, c.abilityOpts && c.abilityOpts.runeId, Math.round(c.score * 100) / 100];
      }).sort(function(a, b) { return b[3] - a[3]; });
      _aiClearMoveEvalCache();
      var best = aiChooseActionPhase(0).best;
      out['R' + rl[0] + ' loots ' + rl[1]] = { top: cands.slice(0, 8), chosen: best && [best.unit.name, best.type, best.target && best.target.name, best.abilityOpts && best.abilityOpts.runeId, Math.round(best.score * 100) / 100] };
    });
  });
  return out;
})()
