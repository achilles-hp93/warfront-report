;(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteFantasyDoctrines',
  test: { name: 'TMP preset dump', fn: function() {
    var out = PRESET_ARMIES_DATA.map(function(entry) {
      var read = _armoryReadSavedArmy(entry, entry.faction);
      var leg = armyLegality(read.templates, armyGearRp(read.gearMap));
      var doc = entry.doctrineId && entry.doctrineId !== 'none' ? getDoctrineById(entry.doctrineId) : null;
      return {
        id: entry.id, name: entry.name, faction: entry.faction, factionName: _getFactionName(entry.faction),
        subfaction: read.subfactionId ? Factions.subfaction(read.subfactionId).name : null,
        doctrineId: entry.doctrineId, doctrine: doc ? doc.name : null, fielded: _getFormationDoctrineLabel(entry, entry.faction),
        marshalIndex: read.marshalIndex, leaderMap: read.leaderMap, problems: read.problems,
        rp: leg.rp, unitsRp: leg.unitsRp, count: leg.cappedCount, errors: leg.errors.map(function(e) { return e.message; }),
        units: read.templates.map(function(t, i) {
          var g = read.gearMap[i];
          return { id: t.rawId || t.id, name: t.name, rp: unitRpCost(t), tier: unitTier(t),
            character: (t.tags || []).indexOf('CHARACTER') >= 0, tags: t.tags,
            gear: g ? { name: g.name, rp: Number(g.gearRp) || 0 } : null };
        }),
      };
    });
    return '@@JSON@@' + JSON.stringify(out) + '@@END@@';
  } },
});
