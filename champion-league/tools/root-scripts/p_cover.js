(function(){
  var drafts = [
    { id:'d_albion', faction:'grand_duchy_of_albion', units:['waymarshal','sidhe_wardens','draoi','sidhe_wardens','blackflint_archers','barghest','coblynau_sapper','coblynau_sapper','rootwall_dryads','rootwall_dryads'], leaderMap:{'0':1,'2':3} },
    { id:'d_imperium', faction:'iron_imperium', units:['caesar_divus_imperator_mounted','palatine_custos_mounted','comitatus_armored_carrier','retiarius_squad','malleus_sappers'], leaderMap:{} },
    { id:'d_caliphate', faction:'caliphate_of_the_two_sanctuaries', units:['naqib','muqatila_troopers','naqib','muqatila_troopers','rammal_geomancer','muqatila_troopers','muqatila_troopers','royal_alchemist','carpet_bomber','carpet_bomber','abna_al_dawla_guard'], leaderMap:{'0':1,'2':3,'4':5} },
  ];
  drafts.forEach(function(d){ d.name = d.id; d.doctrineId = 'none'; d.marshalIndex = 0; PRESET_ARMIES_DATA.push(d); });
  var check = [['grand_duchy_of_albion','glandore_breakers'],['iron_imperium','alea_iacta'],['iron_imperium','scorpion_shields'],['british_liberation_front','caerfyrddin_fencibles'],['caliphate_of_the_two_sanctuaries','horns_of_hattin'],['principality_of_novgorod','opoki_hundred'],['iron_imperium','palatine_guard']]
    .concat(drafts.map(function(d){ return [d.faction, d.id]; }));
  var savedF = G.playerFactions, savedForm = G.formations, savedSaved = _armoryGetSaved, out = [];
  _armoryGetSaved = function() { return []; };
  try {
    check.forEach(function(c) {
      G.playerFactions = ['atashid_empire', c[0]]; G.formations = [null, null];
      _applyAIFormation(1, 'preset:' + c[1]);
      var f = G.formations[1], p = _presetArmiesForFaction(c[0]).filter(function(x){ return x.id === c[1]; })[0];
      var errs = Factions.deckErrors(f.subfactionId, f.units, {});
      var leg = armyLegality(f.units, 0, Factions.tierLimits(f.subfactionId));
      out.push(c[1] + ': ' + f.units.length + ' units, sub ' + f.subfactionId + ', leaders ' + (JSON.stringify(f.leaderMap) === JSON.stringify(p.leaderMap) ? 'as written ' : 'CHANGED ') + JSON.stringify(f.leaderMap) + ', marshal ' + f.units[f.marshalIndex].name + ', legality ' + (leg.errors.concat(errs).join('; ') || 'ok'));
    });
  } finally { G.playerFactions = savedF; G.formations = savedForm; _armoryGetSaved = savedSaved; }
  console.log(out.join('\n'));
})();
