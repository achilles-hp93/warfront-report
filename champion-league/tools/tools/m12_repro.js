(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteCQB',
  test: { name: 'SCRATCH m12 repro', fn() {
    return _withCleanBoard(function() {
      var out = [];
      G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 4; G.activePlayer = 1; G.initiative = 1;
      var dims = getBoardDimensions(); out.push('board ' + JSON.stringify(dims));
      var shooter = _place(createUnit('infernal_congregations:cultists', 1), 14, 7);
      shooter.ap = 1; shooter.usedAction = false; shooter.attacked = false;
      var maidens = _place(createUnit('runeforge_directorate:shieldmaidens', 0), 8, 7);
      var valk = _place(createUnit('runeforge_directorate:valkyrie', 0), 8, 7);
      out.push('attach ' + JSON.stringify(attachLeader(valk, maidens, { ignoreAdjacency: true, ignoreMoved: true })));
      out.push('alt maidens ' + unitAltitudeLayer(maidens) + ' valk ' + unitAltitudeLayer(valk));
      var ct3 = _place(createUnit('infernal_congregations:cultists', 1), 7, 6);
      var rs = _place(createUnit('runeforge_directorate:runesmith', 0), 10, 6);
      var ein = _place(createUnit('runeforge_directorate:odins_einherjar', 0), 7, 8);
      var groups = Weapons.groups(shooter, 'ranged');
      var w = groups[0].weapon;
      out.push('canAttack ct3 ' + JSON.stringify(canAttackWithWeapon(shooter, ct3, w)));
      out.push('canAttack maidens ' + JSON.stringify(canAttackWithWeapon(shooter, maidens, w)));
      out.push('engaged maidens ' + isEngaged(maidens) + ' state ' + JSON.stringify(getRangedIntoMeleeState(shooter, maidens, w).candidates.map(function(u){return u.name;})));
      out.push('stray ' + JSON.stringify(aiStrayShot(shooter, maidens, w) && aiStrayShot(shooter, maidens, w).friend.name));
      [maidens, rs, ein].forEach(function(t) {
        var p = _aiPickBestCompositionAttack(shooter, t);
        out.push('pick vs ' + t.name + ': ' + (p ? p.type + ' ' + p.score.toFixed(2) : 'none'));
      });
      var best = aiChooseActionPhase(1).best;
      out.push('best ' + (best ? best.type + ' ' + (best.unit && best.unit.name) + ' -> ' + (best.target && best.target.name) : 'none'));
      return out.join('\n');
    });
  }},
});
