(function() {
  var out = {};
  _withCleanBoard(function() {
    setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === 'CROSSROADS'; })[0]);
    G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.round = 1;
    var dims = getBoardDimensions();
    var armies = [
      ['iron_imperium', ['palatine_protospatharius','palatine_custos','palatine_artillerists','praetorian_tribune','praetorian_strikers'], { 0: 1, 3: 4 }],
      ['covenant_of_new_jerusalem', ['archistrategos','knight_apostle','saint_militant','covenant_levies','covenant_levies','covenant_levies','covenant_levies','covenant_levies','jordanite_hospitaller','jordanite_hospitaller','cantor_preceptor'], { 0: 1, 10: 3 }],
    ];
    armies.forEach(function(a, p) {
      var units = a[1].map(function(id, i) {
        var u = createUnit(a[0] + ':' + id, p);
        var row = p === 0 ? dims.rows - 2 : 1;
        return _place(u, 1 + i, row);
      });
      Object.keys(a[2]).forEach(function(li) {
        try { attachLeader(units[li], units[a[2][li]], { ignoreAdjacency: true, ignoreMoved: true }); } catch (e) {}
      });
    });

    var ids = PRIMARY_MISSIONS_DATA.map(function(c) { return c.id; });
    [0, 1].forEach(function(p) {
      var army = _aiPrimaryArmy(p);
      out['p' + p] = { kills: +army.kills.toFixed(2), losses: +army.losses.toFixed(2), mine: army.mine.length, theirs: army.theirs.length };
      ids.forEach(function(id) {
        var c = primaryMissionCard(id);
        out['p' + p][id] = +(aiPrimaryMissionWorth(c, p, army)).toFixed(2) + (primaryMissionFitsArmy(c, p) ? '' : ' (unfit)');
      });
    });
  });
  return out;
})()
