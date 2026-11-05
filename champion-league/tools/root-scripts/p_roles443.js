(function(){
  var out = {};
  _withCleanBoard(function() {
    Object.keys(UNITS_DATA).sort().forEach(function(id) {
      if (id === 'hq') return;
      var unit = _place(createUnit(id, 0), 5, 5);
      var v = [_aiRoleWeaponValue(unit, 'melee'), _aiRoleWeaponValue(unit, 'ranged'), _aiRoleEffectiveHP(unit)];
      var tags = _aiBuildRoleTags(unit).tags;
      Object.keys(tags).sort().forEach(function(tag) { v.push(tag, tags[tag]); });
      out[id] = v;
      G.units = [];
    });
  });
  return 'JSON' + JSON.stringify(out);
})()
