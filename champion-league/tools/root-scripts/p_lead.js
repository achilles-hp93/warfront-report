(function(){
  var facs = { kingdom_of_hayk: ['andranik_ozanian','dream_reader','reedfire_champion','azat_lancers','pahak_riflemen','parsawor_grenadiers','vishap_harpooners'],
    euskal_herria: ['tomas_zumalakarregi','foral_captain','sorgin','basajaun_smith','etxe_riflemen','mikelete_marksmen','sugaar_gun'],
    kalevan_kansa: ['vainamoinen','winter_captain','tietaja','tulikettu','peijaiset_wardens','nostovaki_militia','erankavijat_recons','ukko_thunder_sledge'],
    great_cossack_host: ['ivan_sirko','ivan_sirko_mounted','host_osaul','kharakternyk','host_sotnia','terek_shashka_riders','kuban_plastuns'],
    jade_mandate: ['five_banner_marshal','war_taoist','azure_banner_braves','commandery_bannermen','terracotta_vanguard','vermillion_rocket_battery','white_pole_guard'],
    mat_akkadi: ['gilgamesh','asipu_priest','turtanu','ummanu_sky_scribe','ashur_breachguard','floodgate_sappers','ishtar_lion_chariot','lamassu_bastion','temple_levy'],
    polish_lithuanian_ruthenian_commonwealth: ['tadeusz_kosciuszko','crown_guard_captain','rotmistrz','tri_banner_chaplain','commonwealth_fusiliers','consecrated_hussars','silesian_hammerguards'] };
  var out = {};
  _withCleanBoard(function(){
    Object.keys(facs).forEach(function(fac) {
      var units = facs[fac].map(function(id, i) { var u = createUnit(fac + ':' + id, 0); return u; });
      var lines = [];
      units.forEach(function(l) {
        if (!_fantasyLeaderIsCharacter(l)) return;
        var ok = units.filter(function(s) { return s !== l && canAttachLeader(l, s, { ignoreAdjacency: true, ignoreMoved: true }).ok; }).map(function(s) { return s.templateId || s.id; });
        lines.push((l.templateId || l.id) + ' -> ' + (ok.join(', ') || 'none'));
      });
      out[fac] = lines;
    });
  });
  return out;
})()
