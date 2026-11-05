(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteOps',
  test: { name: 'PROBE hunger at the attack', fn() {
    var out = [];
    var probe = function(kind, h) {
      _withCleanBoard(function() {
        var saved = rollDie;
        try {
          G.round = 3; G.battlePhase = 'ACTION';
          var k = _place(createUnit('golden_khaganate:khesig_guards', 0), 5, 5);
          var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 5, kind === 'melee' ? 6 : 9);
          setUnitResource(k, 'hunger', h);
          var w = Weapons.first(k, kind);
          var g = Weapons.groups(k, kind)[0];
          var seenHunger = [];
          var apSeen = [];
          rollDie = function() { seenHunger.push(unitResourceValue(k, 'hunger') + '/AP' + Weapons.bonus(k, w, 'ap') + '/MS' + Stats.unit(k, 'MS').value); return 1; };
          try {
            if (kind === 'melee') resolveMeleeAttack(k, foe, w, {});
            else resolveAttack(k, foe, w, {});
          } finally {}
          out.push(kind + ' H' + h + ': group ' + (kind === 'melee' ? 'AR ' + g.totalAR : 'FR ' + g.totalFR) + ', MS ' + g.ms + ', tags ' + (g.weapon.tags || []).join('|')
            + ' | dice ' + seenHunger.length + ', hunger while rolling ' + JSON.stringify(Array.from(new Set(seenHunger)))
            + ', AP bonus read ' + JSON.stringify(Array.from(new Set(apSeen))) + ', hunger after ' + unitResourceValue(k, 'hunger'));
        } finally { rollDie = saved; }
      });
    };
    [0, 5].forEach(function(h) { probe('melee', h); });
    [0, 5].forEach(function(h) { probe('ranged', h); });
    return out.join('\n');
  }},
});
