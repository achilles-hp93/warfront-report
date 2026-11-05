(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteCQB',
  test: { name: 'SCRATCH m07 repro', fn() {
    return _withCleanBoard(function() {
      var out = [];
      var map = (MAPS_DATA || []).find(function(m) { return m.name === 'CROSSROADS' || m.id === 'CROSSROADS' || m.id === 'crossroads'; });
      if (!map) return 'no map; ids ' + MAPS_DATA.map(function(m){return m.id+'/'+m.name;}).join(',');
      setBoardFromMap(map);
      G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 4; G.activePlayer = 1;
      var rows = [[0,"hq",7,13],[0,"caliphate_of_the_two_sanctuaries:saladin",6,7],[0,"caliphate_of_the_two_sanctuaries:abna_al_dawla_guard",6,7],[0,"caliphate_of_the_two_sanctuaries:muqatila_troopers",6,6],[0,"caliphate_of_the_two_sanctuaries:rammal_geomancer",2,8],[0,"caliphate_of_the_two_sanctuaries:bounded_ifrit",5,10],[1,"hq",7,1],[1,"church_of_the_beast:herald_of_feral_affliction",7,6],[1,"church_of_the_beast:assault_lycanthropes",12,8],[1,"church_of_the_beast:wildling_acolytes",7,8],[1,"church_of_the_beast:weretiger_stalkers",8,7],[1,"church_of_the_beast:beast_monk",1,8],[1,"church_of_the_beast:marrowstring_centaur",8,6],[1,"church_of_the_beast:wendigo_manreaver",2,7]];
      var units = rows.map(function(r) { return _place(createUnit(r[1], r[0], r[1] === 'hq'), r[2], r[3]); });
      var ifrit = units[5], centaur = units[12];
      centaur.ap = 1; centaur.usedAction = false; centaur.attacked = false;
      G.units.forEach(function(u) { recomputeIntelOnMove(u); });
      var bow = Weapons.groups(centaur, 'ranged')[0].weapon;
      var probe = function(label) {
        out.push(label + ': terrain ' + JSON.stringify(terrainDefAt(ifrit.col, ifrit.row).name || terrainAt(ifrit.col, ifrit.row)) + ' elev ' + (typeof elevationAt === 'function' ? elevationAt(ifrit.col, ifrit.row) : '?'));
        out.push('  spotted by B ' + isSpotted(1, ifrit.col, ifrit.row, ifrit) + ' intel ' + getIntelLevel(ifrit, 1));
        G.units.filter(function(u) { return u.player === 1 && u.alive; }).forEach(function(u) {
          out.push('    ' + u.name + ' @' + u.col + ',' + u.row + ' PER ' + getEffectivePER(u) + ' dist ' + chebyshev(u.col, u.row, ifrit.col, ifrit.row) + ' sees ' + seesSquareFrom(u, getEffectivePER(u), ifrit.col, ifrit.row, ifrit) + ' losSight ' + hasLOS(u, ifrit, { forSight: true }));
        });
        out.push('  combat LOS centaur ' + hasLOS(centaur, ifrit) + ' canAttack ' + JSON.stringify(canAttackWithWeapon(centaur, ifrit, bow)));
        var p = _aiPickBestCompositionAttack(centaur, ifrit);
        out.push('  ai pick ' + (p ? p.type + ' ' + p.score : 'none'));
      };
      probe('R4 ifrit 5,10');
      placeFootprint(ifrit, 5, 9); G.units.forEach(function(u) { recomputeIntelOnMove(u); });
      probe('R3 ifrit 5,9');
      return out.join('\n');
    });
  }},
});
