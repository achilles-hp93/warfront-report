(function(){
  var out = {};
  ['principality_of_novgorod:bogatyr_thunderguards','principality_of_novgorod:veche_levy','principality_of_novgorod:firelance_druzhina','principality_of_novgorod:rynda_guard','golden_khaganate:tamga_bound'].forEach(function(t){
    var u = createUnit(t, 0);
    out[t] = { roles: aiUnitRoleTags(u), moveRole: _aiMoveRole(u), oc: aiOCItBrings(u) };
  });
  return out;
})()
