(function(){
  var TIERS = ['EPIC HERO','EPIC','ELITE','SPECIALIST','STANDARD'];
  var out = PRESET_ARMIES_DATA.map(function(p) {
    var read = _armoryReadSavedArmy(p, p.faction);
    var errs = _savedArmyErrors(p, p.faction).map(function(e){ return e.message; })
      .concat(Factions.deckErrors(read.subfactionId, read.templates, {}).map(function(e){ return e.message || String(e); }));
    var sub = read.subfactionId ? (Factions.subfaction(read.subfactionId) || {}).name || read.subfactionId : null;
    var units = read.templates.map(function(t, i) {
      var g = read.gearMap[i];
      return { id: t.id.split(':').pop(), name: t.name, rp: t.rp, tier: TIERS.filter(function(x){ return (t.tags||[]).indexOf(x) >= 0; })[0],
        character: (t.tags||[]).indexOf('CHARACTER') >= 0, tags: t.tags, gear: g ? { name: g.name, rp: g.gearRp } : null,
        capacity: transportCapacity(t), models: formationEntryLoad(i, function(j){ return read.templates[j]; }, {}) };
    });
    var transport = p.transport || {};
    var tchecks = Object.keys(transport).reduce(function(acc, k) { var ti = transport[k]; if (acc.indexOf(ti) < 0) acc.push(ti); return acc; }, []).map(function(ti) {
      var load = formationTransportLoad(ti, transport, function(j){ return read.templates[j]; }, read.leaderMap);
      var bad = Object.keys(transport).filter(function(k){ return transport[k] === ti && !canEmbarkInFormation(read.templates[+k]); });
      return { transport: ti, load: load, capacity: transportCapacity(read.templates[ti]), cannotEmbark: bad };
    });
    var rp = units.reduce(function(s,u){ return s + u.rp + (u.gear ? u.gear.rp : 0); }, 0);
    return { id: p.id, name: p.name, faction: p.faction, factionName: _getFactionName(p.faction), subfaction: sub,
      marshalIndex: read.marshalIndex, leaderMap: p.leaderMap || {}, transport: transport, transportChecks: tchecks,
      rp: rp, count: units.length, errors: errs.concat(read.problems), units: units };
  });
  console.log('DUMP>>' + JSON.stringify(out) + '<<DUMP');
})();
