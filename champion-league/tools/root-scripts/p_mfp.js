(function(){
  var out = [];
  var ids = Object.keys(UNITS_DATA || {});
  var foeT = 'iron_imperium:legionnaire_squad';
  ids.forEach(function(t){
    try {
      G.units = [];
      var u = createUnit(t, 0); if (!u || u.isHQ) return;
      u.col=7;u.row=12;G.units.push(u);
      var foe = createUnit(foeT, 1); foe.col=7; foe.row=6; G.units.push(foe);
      foe.intelLevel = [2,2];
      var cache = null;
      var p = _aiWithScratchMoveEvalCache(function(){ return _aiMoveFirePenalty(u); });
      var roles = aiUnitRoleTags(u);
      if (p > 0) out.push([t, +p.toFixed(2), Object.keys(roles).join('/'), (u.tags||[]).filter(function(x){return /EXPENDABLE|ELITE|STANDARD|SPECIALIST|EPIC|VEHICLE|INFANTRY|ARTILLERY/.test(x);}).join(',')]);
    } catch (e) { out.push([t, 'ERR ' + e.message]); }
  });
  G.units = [];
  return out;
})()
