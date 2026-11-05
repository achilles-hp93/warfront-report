(function(){
  var out = PRESET_ARMIES_DATA.map(function(p) {
    var read = _armoryReadSavedArmy(p, p.faction);
    var rp = read.templates.reduce(function(s,t){ return s + t.rp; }, 0) + armyGearRp(read.gearMap);
    return { id: p.id, name: p.name, faction: p.faction, rp: rp, gear: p.gear || {}, units: read.templates.map(function(t, i) {
      return { i: i, id: t.id.split(':').pop(), name: t.name, rp: t.rp,
        options: (t.gearOptions || []).map(function(g){ return { name: g.name, rp: g.gearRp, desc: (g.desc || g.description || '').slice(0, 140) }; }) };
    }) };
  });
  console.log('DUMP>>' + JSON.stringify(out) + '<<DUMP');
})();
