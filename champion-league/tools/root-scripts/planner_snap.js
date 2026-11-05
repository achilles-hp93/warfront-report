(function(SNAP) {
  var out = {};
  _withCleanBoard(function() {
    setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === SNAP.map; })[0]);
    G.players = SNAP.factions.map(function(f) { return { factionId: f }; });
    G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 4;
    var jade = SNAP.factions.indexOf('jade_mandate');
    G.activePlayer = jade; AI.player = jade; AI.formationPlans = {};
    G.objectives = (SNAP.objectives || []).map(function(o) { return { col: o.col, row: o.row, vp: o.vp || 2, owner: o.owner == null ? null : o.owner }; });
    var byUid = {};
    SNAP.units.filter(function(u) { return u.js == null; }).forEach(function(u) { byUid[u.uid] = _place(createUnit(u.t, u.p), u.c, u.r); });
    SNAP.units.filter(function(u) { return u.js != null; }).forEach(function(u) {
      var ch = createUnit(u.t, u.p); var squad = byUid[u.js];
      if (squad) { _place(ch, u.c, u.r + 1); try { attachLeader(ch, squad, { ignoreAdjacency: true, ignoreMoved: true }); } catch (e) {} }
    });
    out.formations = Formations.evaluate(jade).formations.map(function(f) { return f.id + ':' + f.units.length; });
    var units = aliveUnits(jade).filter(function(u) { return unitOnBoard(u) && u.joinedSquad == null && !isStructure(u) && !u.isHQ; });
    _aiResetMoveEvalCache(); aiFormationPlanUpdate(jade); _aiClearMoveEvalCache();
    out.plan = AI.formationPlans[jade] && AI.formationPlans[jade].id;
    var run = function() { var t = Date.now(); for (var k = 0; k < 2; k++) units.forEach(function(u) { _aiResetMoveEvalCache(); aiFindGlobalBest(u); _aiClearMoveEvalCache(); }); return Date.now() - t; };
    run();
    out.withTerm = run();
    var tt = _aiFormationTerm; _aiFormationTerm = function() { return 0; };
    out.withoutTerm = run();
    _aiFormationTerm = tt;
    out.withTerm2 = run();
    var cc = _aiFormationCompleted; _aiFormationCompleted = function() { return 0; };
    out.noCompletion = run();
    _aiFormationCompleted = cc;
    var pp = _aiFormationPlanPull; _aiFormationPlanPull = function() { return 0; };
    out.noPlanPull = run();
    _aiFormationPlanPull = pp;
    out.calls = units.length * 2;
  });
  return out;
})({"map":"ACROPOLIS","factions":["jade_mandate","polish_lithuanian_ruthenian_commonwealth"],"objectives":[{"col":7,"row":7,"vp":3,"owner":null,"name":null},{"col":1,"row":7,"vp":2,"owner":null,"name":null},{"col":13,"row":7,"vp":2,"owner":null,"name":null}],"units":[{"t":"jade_mandate:five_banner_marshal","p":0,"c":4,"r":7,"uid":20,"js":"White Pole Guard"},{"t":"jade_mandate:white_pole_guard","p":0,"c":4,"r":7,"uid":21,"js":null},{"t":"jade_mandate:war_taoist","p":0,"c":5,"r":10,"uid":22,"js":"Commandery Bannermen 1"},{"t":"jade_mandate:commandery_bannermen","p":0,"c":5,"r":10,"uid":23,"js":null},{"t":"jade_mandate:commandery_bannermen","p":0,"c":10,"r":8,"uid":24,"js":null},{"t":"jade_mandate:terracotta_vanguard","p":0,"c":6,"r":8,"uid":25,"js":null},{"t":"jade_mandate:azure_banner_braves","p":0,"c":8,"r":9,"uid":27,"js":null},{"t":"jade_mandate:vermillion_rocket_battery","p":0,"c":9,"r":12,"uid":28,"js":null},{"t":"jade_mandate:vermillion_rocket_battery","p":0,"c":3,"r":12,"uid":29,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:tadeusz_kosciuszko","p":1,"c":8,"r":7,"uid":31,"js":"Silesian Hammerguards"},{"t":"polish_lithuanian_ruthenian_commonwealth:silesian_hammerguards","p":1,"c":8,"r":7,"uid":32,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:rotmistrz","p":1,"c":5,"r":6,"uid":33,"js":"Consecrated Hussars 1"},{"t":"polish_lithuanian_ruthenian_commonwealth:consecrated_hussars","p":1,"c":5,"r":6,"uid":34,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:consecrated_hussars","p":1,"c":9,"r":4,"uid":35,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:commonwealth_fusiliers","p":1,"c":8,"r":4,"uid":36,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:commonwealth_fusiliers","p":1,"c":7,"r":4,"uid":37,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:commonwealth_fusiliers","p":1,"c":11,"r":4,"uid":38,"js":null},{"t":"jade_mandate:commandery_bannermen","p":0,"c":6,"r":9,"uid":39,"js":null}]})
