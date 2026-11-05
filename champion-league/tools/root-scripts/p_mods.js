(function(){
  var out = { units: 0, missingUnit: 0, models: 0, missingModel: 0 };
  _withCleanBoard(function(){
    ['golden_khaganate:stormrider','golden_khaganate:black_shaman','golden_khaganate:genghis_khan','iron_imperium:legionnaire_squad','church_of_the_beast:marrowstring_centaur'].forEach(function(id, i) {
      var u = _place(createUnit(id, 0), 2 + i, 2);
      out.units++; if (!Array.isArray(u._modifiers)) out.missingUnit++;
      Models.all(u).forEach(function(m) { out.models++; if (!Array.isArray(m._modifiers)) out.missingModel++; });
    });
  });
  return out;
})()
