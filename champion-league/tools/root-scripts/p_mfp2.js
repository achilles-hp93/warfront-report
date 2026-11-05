(function(){
  var out = [];
  _withCleanBoard(function(){
  Object.keys(UNITS_DATA).forEach(function(t){
    try {
      G.units = [];
      var u = createUnit(t, 0); if (!u || u.isHQ) return;
      _place(u, 7, 12);
      var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 6);
      foe.intelLevel = [2,2];
      var p = _aiWithScratchMoveEvalCache(function(){ return _aiMoveFirePenalty(u); });
      var roles = aiUnitRoleTags(u);
      if (p > 0) out.push(t + ' | ' + p.toFixed(2) + ' | ' + Object.keys(roles).join('/') + ' | ' + ((u.tags||[]).filter(function(x){return /EXPENDABLE|ELITE|STANDARD|SPECIALIST|EPIC|VEHICLE|INFANTRY|ARTILLERY|MOUNTED/.test(x);}).join(',')));
    } catch (e) { out.push(t + ' ERR ' + e.message); }
  });
  });
  return out.join('\n');
})()
