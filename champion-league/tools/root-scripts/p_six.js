(function(){
  var drafts = [
    { id:'d_cliodhna', faction:'grand_duchy_of_albion', units:['cliodhna_the_dread_tide','sidhe_wardens','fey_lord','sidhe_wardens','sidhe_wardens','fomorian_tidebreaker','briton_yeomen','briton_yeomen','morrigans_chosen'], leaderMap:{'0':1,'2':3} },
    { id:'d_caesar', faction:'iron_imperium', units:['caesar_divus_imperator','ironthunder_vanguard','ironthunder_vanguard','champion_of_mars','legionnaire_squad','legionnaire_squad','speculatores'], leaderMap:{'0':1} },
    { id:'d_praetorians', faction:'iron_imperium', subfactionId:'officia_caesaris', units:['praetorian_tribune','praetorian_strikers','praetorian_tribune','praetorian_gunners','praetorian_strikers','praetorian_gunners','praetorian_fireteam'], leaderMap:{'0':1,'2':3} },
    { id:'d_blf', faction:'british_liberation_front', units:['knight_banneret','knight_bulwarks','alba_highlanders','alba_highlanders','parish_militia','parish_militia','parish_militia','parish_militia','eire_pathfinders','prydain_field_gun','house_of_glass_arcanist'], leaderMap:{'0':1} },
    { id:'d_saladin', faction:'caliphate_of_the_two_sanctuaries', units:['saladin_mounted','khassakiyya_guard','isfahsalar','khassakiyya_guard','muqatila_troopers'], leaderMap:{'0':1,'2':3} },
    { id:'d_tys', faction:'principality_of_novgorod', units:['tysyatsky','koscheyan_troopers','tysyatsky','ushkuynik_marines','koscheyan_troopers','leshen_besieger','veche_levy','veche_levy','veche_levy'], leaderMap:{'0':1,'2':3} },
  ];
  drafts.forEach(function(d){ d.name = d.id; d.doctrineId = 'none'; d.marshalIndex = 0; PRESET_ARMIES_DATA.push(d); });
  var check = drafts.concat([{id:'palatine_guard', faction:'iron_imperium'}, {id:'merlin_army', faction:'british_liberation_front'}]);
  var savedF = G.playerFactions, savedForm = G.formations, savedSaved = _armoryGetSaved, out = [];
  _armoryGetSaved = function() { return []; };
  try {
    check.forEach(function(c) {
      G.playerFactions = ['atashid_empire', c.faction]; G.formations = [null, null];
      _applyAIFormation(1, 'preset:' + c.id);
      var f = G.formations[1], p = _presetArmiesForFaction(c.faction).filter(function(x){ return x.id === c.id; })[0];
      var rp = f.units.reduce(function(s,u){ return s + (UNITS_DATA[c.faction + ':' + (u.templateId || u.id)] || {}).rp || 0; }, 0);
      var tmpl = f.units.map(function(u){ return UNITS_DATA[c.faction + ':' + (u.templateId || u.id)] || u; });
      var leg = armyLegality(tmpl, 0, Factions.tierLimits(f.subfactionId));
      out.push(c.id + ': ' + f.units.length + ' units, RP ' + rp + ', leaders ' + JSON.stringify(f.leaderMap) + (JSON.stringify(f.leaderMap) === JSON.stringify(p.leaderMap) ? ' as written' : ' (preset ' + JSON.stringify(p.leaderMap) + ')') + ', marshal ' + f.units[f.marshalIndex].name + ', legality ' + (leg.errors.length ? leg.errors.join('; ') : 'ok'));
    });
  } finally { G.playerFactions = savedF; G.formations = savedForm; _armoryGetSaved = savedSaved; }
  console.log(out.join('\n'));
})();
