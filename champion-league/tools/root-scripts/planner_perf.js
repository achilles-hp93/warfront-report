(function() {
  var out = {};
  _jadeWithBoard(function() {
    setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === 'CROSSROADS'; })[0]);
    G.players = [{ factionId: 'jade_mandate' }, { factionId: 'polish_lithuanian_ruthenian_commonwealth' }];
    G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 2; G.activePlayer = 0; AI.player = 0;
    var dims = getBoardDimensions();
    var row = Math.floor(dims.rows / 2) + 2;
    var jade = ['commandery_bannermen', 'commandery_bannermen', 'terracotta_vanguard', 'terracotta_vanguard', 'azure_banner_braves', 'vermillion_rocket_battery'].map(function(id, i) {
      return _place(createUnit('jade_mandate:' + id, 0), 2 + 2 * i, row + (i % 2));
    });
    ['consecrated_hussars', 'commonwealth_fusiliers', 'silesian_hammerguards'].forEach(function(id, i) {
      _place(createUnit('polish_lithuanian_ruthenian_commonwealth:' + id, 1), 3 + 4 * i, row - 6);
    });
    G.objectives = [{ col: 7, row: Math.floor(dims.rows / 2), vp: 3, owner: null }];
    var time = function(label) {
      _aiResetMoveEvalCache();
      aiFormationPlanUpdate(0);
      var t0 = Date.now();
      for (var k = 0; k < 3; k++) jade.forEach(function(u) { aiFindGlobalBest(u); });
      out[label] = Date.now() - t0;
      out[label + '_cache'] = !!_aiMoveEvalCache();
      _aiClearMoveEvalCache();
    };
    time('with');
    var counts = { reach: 0, view: 0, plan: 0 };
    var r0 = _aiFormationReach, v0 = _aiFormationView, p0 = _aiFormationPlanPull;
    _aiFormationReach = function(u) { counts.reach++; return r0(u); };
    _aiFormationView = function(p) { counts.view++; return v0(p); };
    time('counted');
    out.counts = counts;
    _aiFormationReach = r0; _aiFormationView = v0;
    var t0term = _aiFormationTerm;
    _aiFormationTerm = function() { return 0; };
    time('without');
    _aiFormationTerm = t0term;
    out.plan = AI.formationPlans && AI.formationPlans[0] ? AI.formationPlans[0].id : null;
  });
  return out;
})()
