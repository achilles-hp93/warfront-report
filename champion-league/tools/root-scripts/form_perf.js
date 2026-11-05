(function() {
  var out = {};
  _jadeWithBoard(function() {
    setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === 'CROSSROADS'; })[0]);
    G.players = [{ factionId: 'jade_mandate' }, { factionId: 'polish_lithuanian_ruthenian_commonwealth' }];
    G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 2; G.activePlayer = 0; AI.player = 0;
    var dims = getBoardDimensions();
    // Black Tortoise oxoxo on the row nearest the middle, three more Jade units behind.
    var row = Math.floor(dims.rows / 2) + 2;
    ['commandery_bannermen', 'commandery_bannermen', 'terracotta_vanguard'].forEach(function(id, i) {
      var u = _place(createUnit('jade_mandate:' + id, 0), 3 + 2 * i, row);
    });
    ['terracotta_vanguard', 'azure_banner_braves', 'vermillion_rocket_battery'].forEach(function(id, i) {
      _place(createUnit('jade_mandate:' + id, 0), 3 + 3 * i, row + 2);
    });
    ['legionnaire_squad', 'legionnaire_squad', 'legionnaire_squad', 'legionnaire_squad'].forEach(function(id, i) {
      _place(createUnit('iron_imperium:' + id, 1), 2 + 3 * i, row - 6);
    });
    out.formations = Formations.evaluate(0).formations.map(function(f) { return f.id; });
    var calls = 0, depth = 0, maxDepth = 0;
    var orig = _aiFormationWorthNow;
    _aiFormationWorthNow = function(f) { calls++; depth++; maxDepth = Math.max(maxDepth, depth); try { return orig(f); } finally { depth--; } };
    var t0 = Date.now();
    try {
      var decision = aiDecideMovement(0);
      out.decision = decision && (decision.type + ' ' + (decision.unit && decision.unit.name) + ' -> ' + JSON.stringify(decision.dest || decision.target || null));
    } catch (e) { out.error = String(e && e.message).slice(0, 200); }
    out.ms = Date.now() - t0;
    out.worthCalls = calls; out.maxDepth = maxDepth;
    _aiFormationWorthNow = orig;
  });
  return out;
})()
