(globalThis.__WARFRONT_TEST_CASES__ = globalThis.__WARFRONT_TEST_CASES__ || []).push({
  suiteId: 'suiteAI',
  test: { name: 'zz explore doc', fn: function() {
    var out = [];
    var show = function(label, names) {
      var saved = aiCommandCpKeptWorth;
      aiCommandCpKeptWorth = function() { return -1; };
      try {
        (aiBuildHQCommandCandidates(0) || []).forEach(function(c) {
          if (names.indexOf(c.cmd.name) >= 0) out.push(label + ' ' + c.cmd.name + ' w=' + c.weight.toFixed(2) + ' cp=' + c.cpCost + ' kept=' + saved(c.cpCost).toFixed(2));
        });
      } finally { aiCommandCpKeptWorth = saved; }
    };
    _withCleanBoard(function() {
      G.round = 2; G.battlePhase = 'COMMAND';
      _gaiSetup('ichorous_engine');
      var talos = _place(createUnit('iron_imperium:talos_warcolossus', 0), 3, 3);
      talos.models[0].hp = Math.max(1, (talos.models[0].hpMax || 5) - 3);
      Models.projectCompatibility(talos);
      _place(createUnit('atashid_empire:shieldbearers', 1), 6, 3);
      show('ichor', ['Eradication Imperative', 'Autorepair Protocol']);
    });
    _withCleanBoard(function() {
      G.round = 2; G.battlePhase = 'COMMAND';
      _gaiSetup('wild_hunt');
      _place(createUnit('grand_duchy_of_albion:wild_hunt_riders', 0), 3, 3);
      _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 3);
      show('hunt', ['Dark Harvest', 'Relentless Pursuit']);
    });
    _withCleanBoard(function() {
      G.round = 2;
      _gaiSetup('avalanche_of_contempt');
      _place(createUnit('infernal_congregations:cultists', 0), 3, 3);
      _place(createUnit('infernal_congregations:avatar_of_wrath', 0), 4, 3);
      _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 3);
      show('sac', ['Unholy Sacrifice']); out.push('sac all: ' + (function(){ var s = aiCommandCpKeptWorth; aiCommandCpKeptWorth = function(){return -1;}; try { return (aiBuildHQCommandCandidates(0)||[]).map(function(c){return c.cmd.name+':'+c.weight.toFixed(2);}).join(', '); } finally { aiCommandCpKeptWorth = s; } })()); var hq2 = G.units.filter(function(u){return u.isHQ;})[0]; out.push('cmds: ' + (hq2.commands||[]).map(function(c){return c.name;}).join(', '));
    });
    return out.join('\n');
  } },
});
