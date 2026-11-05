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
    var c = { completed: 0, worthNow: 0, formationAt: 0, planBest: 0 };
    var w0 = _aiFormationCompleted, n0 = _aiFormationWorthNow, f0 = Formations.formationAt, p0 = _aiFormationPlanBest;
    _aiFormationCompleted = function(u, col, row, own) { c.completed++; return w0(u, col, row, own); };
    _aiFormationWorthNow = function(f) { c.worthNow++; var t = Date.now(); try { return n0(f); } finally { c.worthMs = (c.worthMs || 0) + Date.now() - t; } };
    _aiFormationPlanBest = function(a, b, d) { c.planBest++; var t = Date.now(); try { return p0(a, b, d); } finally { c.planMs = (c.planMs || 0) + Date.now() - t; } };
    var t0 = Date.now();
    var d = aiDecideMovement(jade);
    out.ms = Date.now() - t0;
    out.decision = d && (d.type + ' ' + d.unit.name);
    out.counts = c;
    _aiFormationCompleted = w0; _aiFormationWorthNow = n0; _aiFormationPlanBest = p0;
    var tTerm = _aiFormationTerm; _aiFormationTerm = function() { return 0; };
    AI.formationPlans = {};
    var t1 = Date.now(); aiDecideMovement(jade); out.msWithoutTerm = Date.now() - t1;
    _aiFormationTerm = tTerm;
  });
  return out;
})({"map":"ACROPOLIS","factions":["jade_mandate","polish_lithuanian_ruthenian_commonwealth"],"objectives":[{"col":7,"row":7,"vp":3,"owner":null,"name":null},{"col":1,"row":7,"vp":2,"owner":null,"name":null},{"col":13,"row":7,"vp":2,"owner":null,"name":null}],"units":[{"t":"jade_mandate:five_banner_marshal","p":0,"c":4,"r":7,"uid":20,"js":"White Pole Guard"},{"t":"jade_mandate:white_pole_guard","p":0,"c":4,"r":7,"uid":21,"js":null},{"t":"jade_mandate:war_taoist","p":0,"c":5,"r":10,"uid":22,"js":"Commandery Bannermen 1"},{"t":"jade_mandate:commandery_bannermen","p":0,"c":5,"r":10,"uid":23,"js":null},{"t":"jade_mandate:commandery_bannermen","p":0,"c":10,"r":8,"uid":24,"js":null},{"t":"jade_mandate:terracotta_vanguard","p":0,"c":6,"r":8,"uid":25,"js":null},{"t":"jade_mandate:azure_banner_braves","p":0,"c":8,"r":9,"uid":27,"js":null},{"t":"jade_mandate:vermillion_rocket_battery","p":0,"c":9,"r":12,"uid":28,"js":null},{"t":"jade_mandate:vermillion_rocket_battery","p":0,"c":3,"r":12,"uid":29,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:tadeusz_kosciuszko","p":1,"c":8,"r":7,"uid":31,"js":"Silesian Hammerguards"},{"t":"polish_lithuanian_ruthenian_commonwealth:silesian_hammerguards","p":1,"c":8,"r":7,"uid":32,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:rotmistrz","p":1,"c":5,"r":6,"uid":33,"js":"Consecrated Hussars 1"},{"t":"polish_lithuanian_ruthenian_commonwealth:consecrated_hussars","p":1,"c":5,"r":6,"uid":34,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:consecrated_hussars","p":1,"c":9,"r":4,"uid":35,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:commonwealth_fusiliers","p":1,"c":8,"r":4,"uid":36,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:commonwealth_fusiliers","p":1,"c":7,"r":4,"uid":37,"js":null},{"t":"polish_lithuanian_ruthenian_commonwealth:commonwealth_fusiliers","p":1,"c":11,"r":4,"uid":38,"js":null},{"t":"jade_mandate:commandery_bannermen","p":0,"c":6,"r":9,"uid":39,"js":null}]})
