(function() {
  var out = {};
  _jadeWithBoard(function() {
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; AI.player = 0;
    var units = _jadePlaceFormation('yellow_dragon', 0, 5, 5);
    out.ids = _jadeFormationIds(units);
    var obj = G.objectives[G.objectives.length - 1];
    out.obj = obj;
    out.ocs = units.map(function(u) { return getEffectiveOC(u); });
    out.models = units.map(function(u) { return Models.alive(u).length; });
    out.leadNone = Formations.withUnitIn(units[0], null, function() { return getEffectiveOC(units[0]); });
  });
  return out;
})()
