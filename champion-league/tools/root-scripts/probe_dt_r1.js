(function() {
  var board = {"units": [{"uid": 17, "name": "HQ", "player": 0, "templateId": "hq", "col": 7, "row": 13, "joinedSquad": null, "isHQ": true}, {"uid": 18, "name": "Palatine Protospatharius", "player": 0, "templateId": "iron_imperium:palatine_protospatharius", "col": 4, "row": 12, "joinedSquad": "Palatine Custos", "isHQ": false}, {"uid": 19, "name": "Palatine Custos", "player": 0, "templateId": "iron_imperium:palatine_custos", "col": 4, "row": 12, "joinedSquad": null, "isHQ": false}, {"uid": 20, "name": "Palatine Artillerists", "player": 0, "templateId": "iron_imperium:palatine_artillerists", "col": 11, "row": 12, "joinedSquad": null, "isHQ": false}, {"uid": 21, "name": "Praetorian Tribune", "player": 0, "templateId": "iron_imperium:praetorian_tribune", "col": 9, "row": 12, "joinedSquad": "Praetorian Strikers", "isHQ": false}, {"uid": 22, "name": "Praetorian Strikers", "player": 0, "templateId": "iron_imperium:praetorian_strikers", "col": 9, "row": 12, "joinedSquad": null, "isHQ": false}, {"uid": 23, "name": "HQ", "player": 1, "templateId": "hq", "col": 7, "row": 1, "joinedSquad": null, "isHQ": true}, {"uid": 24, "name": "Archistrategos", "player": 1, "templateId": "covenant_of_new_jerusalem:archistrategos", "col": 11, "row": 2, "joinedSquad": "Knight-Apostle Squad", "isHQ": false}, {"uid": 25, "name": "Knight-Apostle Squad", "player": 1, "templateId": "covenant_of_new_jerusalem:knight_apostle", "col": 11, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 26, "name": "Saint-Militant", "player": 1, "templateId": "covenant_of_new_jerusalem:saint_militant", "col": 5, "row": 1, "joinedSquad": null, "isHQ": false}, {"uid": 27, "name": "Covenant Levies 1", "player": 1, "templateId": "covenant_of_new_jerusalem:covenant_levies", "col": 7, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 28, "name": "Covenant Levies 2", "player": 1, "templateId": "covenant_of_new_jerusalem:covenant_levies", "col": 5, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 29, "name": "Covenant Levies 3", "player": 1, "templateId": "covenant_of_new_jerusalem:covenant_levies", "col": 9, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 30, "name": "Covenant Levies 4", "player": 1, "templateId": "covenant_of_new_jerusalem:covenant_levies", "col": 4, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 31, "name": "Covenant Levies 5", "player": 1, "templateId": "covenant_of_new_jerusalem:covenant_levies", "col": 8, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 32, "name": "Jordanite Hospitallers 1", "player": 1, "templateId": "covenant_of_new_jerusalem:jordanite_hospitaller", "col": 10, "row": 1, "joinedSquad": null, "isHQ": false}, {"uid": 33, "name": "Jordanite Hospitallers 2", "player": 1, "templateId": "covenant_of_new_jerusalem:jordanite_hospitaller", "col": 3, "row": 2, "joinedSquad": null, "isHQ": false}, {"uid": 34, "name": "Cantor-Preceptor", "player": 1, "templateId": "covenant_of_new_jerusalem:cantor_preceptor", "col": 7, "row": 2, "joinedSquad": "Covenant Levies 1", "isHQ": false}], "objectives": [{"col": 7, "row": 7, "vp": 3, "owner": null, "name": null}, {"col": 1, "row": 7, "vp": 2, "owner": null, "name": null}, {"col": 13, "row": 7, "vp": 2, "owner": null, "name": null}]};
  return _withCleanBoard(function() {
    var saved = { phase: G.phase, bp: G.battlePhase, round: G.round, obj: G.objectives, player: AI.player, miss: AI.missives };
    try {
      var map = MAPS_DATA.find(function(m) { return m.name === 'ACROPOLIS' || m.id === 'ACROPOLIS'; });
      setBoardFromMap(map);
      G.phase = 'BATTLE'; G.battlePhase = 'COMMAND'; G.round = 1;
      G.objectives = board.objectives.map(function(o) { return { col: o.col, row: o.row, vp: o.vp, owner: null }; });
      var byName = {};
      board.units.forEach(function(b) {
        var u = _place(b.isHQ ? createUnit('hq', b.player, true) : createUnit(b.templateId, b.player), b.col, b.row);
        u.name = b.name; byName[b.player + ':' + b.name] = u; u.ap = 1; u.moved = false; u.intelLevel = [1, 1];
      });
      board.units.forEach(function(b) {
        if (b.joinedSquad) { var r = attachLeader(byName[b.player + ':' + b.name], byName[b.player + ':' + b.joinedSquad]); if (!r.ok) throw new Error('attach ' + b.name + ': ' + r.reason); }
      });
      AI.player = 0; AI.missives = {};
      _aiResetMoveEvalCache();
      aiAssignMissives();
      var custos = byName['0:Palatine Custos'];
      var out = { missive: aiGetMissive(custos).type, target: aiGetMissive(custos).target };
      ['COMMAND', 'MOVEMENT'].forEach(function(ph) {
        G.battlePhase = ph; _aiResetMoveEvalCache();
        aiWithMoveEvalCache(function() {
          var ev = _aiEvalAdvance(custos);
          out[ph] = { canAdvance: _aiCanAdvance(custos), shouldAdvance: ev.shouldAdvance, why: ev.reason || ev.why || null,
            advMP: getAdvanceMovementPoints(custos, advanceExpectedSuccesses(custos)), gain: _aiCommandExtraMoveGain(custos, 2) };
          var adv = getAdvanceMovementPoints(custos, advanceExpectedSuccesses(custos));
          var sq = function(extra) { return reachableSquares(custos, extra).concat(reachableSquares(custos, 0, { mode: 'advance', maxMove: adv + extra })); };
          var p0 = aiChooseDestination(custos, sq(0), { greedy: true }), p2 = aiChooseDestination(custos, sq(2), { greedy: true });
          out[ph].pick0 = p0 && [p0.col, p0.row, +aiScoreDestination(custos, p0).toFixed(1), p0.toward && [p0.toward.col, p0.toward.row]];
          out[ph].pick2 = p2 && [p2.col, p2.row, +aiScoreDestination(custos, p2).toFixed(1), p2.toward && [p2.toward.col, p2.toward.row]];
          var gb = _aiCachedGlobalBest(custos); out[ph].global = gb && [gb.col, gb.row, gb.turnsAway, +gb.score.toFixed(1)];
          out[ph].obj17 = +aiScoreDestination(custos, { col: 1, row: 7 }).toFixed(1);
        });
      });
      return out;
    } finally { G.phase = saved.phase; G.battlePhase = saved.bp; G.round = saved.round; G.objectives = saved.obj; AI.player = saved.player; AI.missives = saved.miss; }
  });
})();
