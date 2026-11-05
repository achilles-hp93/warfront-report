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
    var r = _place(createUnit('runeforge_directorate:corporaider_squad', 0), 1, 1); r.ap = 1;
    var e = _place(createUnit('atashid_empire:shieldbearers', 1), 4, 1); e.ap = 1;
    [10, 11, 12, 14, 15, 19, 20, 29, 30].forEach(function(l) {
      G.loots[0] = l;
      _aiResetMoveEvalCache();
      out[l] = withRulesReading(function() {
        return { ours: _aiMarkAttackers(0, null).map(function(a) { var p = aiRoundAttackPick(a); return p && [a.unit.name, p.enemy.name, p.hp, aiTargetValue(p.enemy)]; }),
          theirs: _aiMarkAttackers(1, null).map(function(a) { var p = aiRoundAttackPick(a); return p && [a.unit.name, p.enemy.name, p.hp, aiTargetValue(p.enemy)]; }),
          direct: [aiRoundAttack(r, e).hp, aiRoundAttack(e, r).hp, aiUnitAttackChance(e, 'any')],
          exch: _aiRoundExchange(0, 'command') };
      });
      _aiClearMoveEvalCache();
    });
  });
  return out;
})()
