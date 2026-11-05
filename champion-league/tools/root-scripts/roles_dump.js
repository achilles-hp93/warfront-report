(function() {
  var out = {};
  _withCleanBoard(function() {
    Object.keys(UNITS_DATA).sort().forEach(function(id) {
      if (id === 'hq') return;
      var unit = _place(createUnit(id, 0), 5, 5);
      var tags = _aiBuildRoleTags(unit).tags;
      out[id] = [_aiRoleWeaponValue(unit, 'melee'), _aiRoleWeaponValue(unit, 'ranged'), _aiRoleEffectiveHP(unit), JSON.stringify(tags)];
      G.units = [];
    });
  });
  globalThis.__fsWrite(globalThis.__ROLES_OUT, JSON.stringify(out));
  return Object.keys(out).length;
})();
