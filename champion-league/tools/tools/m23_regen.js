(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteCQB',
  test: { name: 'SCRATCH m23 regen', fn() {
    return _withCleanBoard(function() {
      var out = [];
      var map = (MAPS_DATA || []).find(function(m) { return m.name === 'CROSSROADS' || m.id === 'CROSSROADS' || m.id === 'crossroads'; });
      setBoardFromMap(map);
      G.players[1].factionId = 'jade_mandate';
      G.phase = 'BATTLE'; G.battlePhase = 'COMMAND';
      var sets = {
        R4: [["hq",7,1],["jade_mandate:war_taoist",6,4],["jade_mandate:commandery_bannermen",6,4],["jade_mandate:commandery_bannermen",8,4],["jade_mandate:commandery_bannermen",13,5],["jade_mandate:commandery_bannermen",1,8],["jade_mandate:commandery_bannermen",4,5],["jade_mandate:terracotta_vanguard",8,6],["jade_mandate:azure_banner_braves",9,6],["jade_mandate:vermillion_rocket_battery",4,0],["jade_mandate:vermillion_rocket_battery",10,0],["jade_mandate:commandery_bannermen",9,2]],
        R5: [["hq",7,1],["jade_mandate:war_taoist",6,5],["jade_mandate:commandery_bannermen",6,5],["jade_mandate:commandery_bannermen",8,7],["jade_mandate:commandery_bannermen",14,6],["jade_mandate:commandery_bannermen",5,5],["jade_mandate:terracotta_vanguard",8,8],["jade_mandate:azure_banner_braves",6,9],["jade_mandate:vermillion_rocket_battery",4,0],["jade_mandate:vermillion_rocket_battery",10,0],["jade_mandate:commandery_bannermen",6,3],["jade_mandate:commandery_bannermen",5,4]],
      };
      Object.keys(sets).forEach(function(k) {
        G.units = [];
        var units = sets[k].map(function(r) { return _place(createUnit(r[0], 1, r[0] === 'hq'), r[1], r[2]); });
        var taoist = units[1], bodyguard = units[2];
        attachLeader(taoist, bodyguard, { ignoreAdjacency: true, ignoreMoved: true });
        var v = units.find(function(u) { return u.templateId === 'jade_mandate:terracotta_vanguard'; });
        Models.applyDamage(v, { wounds: 1, dmgPerWound: 3 }, { source: 'test' });
        var f = Formations.forUnit(v);
        var state = Formations.evaluate(1, {});
        out.push(k + ': vanguard formation ' + (f ? f.id + ' ' + f.units.join('/') : 'none') + ' faction ' + v.faction + ' damaged ' + Stats.health(v).damaged
          + ' regen ' + regenerationThreshold(v) + ' grants ' + JSON.stringify(Modifiers.list(v, { domain: 'grant', stat: 'REGENERATION' }).map(function(r) { return [r.amount, r.when]; }))
          + ' formations ' + JSON.stringify(state.formations.map(function(x) { return x.id + ':' + x.units.join('/'); })));
        var log = [];
        regenerateUnit(v, { log: function(m) { log.push(m); } });
        out.push('  roll log: ' + log.join(' | '));
      });
      return out.join('\n');
    });
  }},
});
