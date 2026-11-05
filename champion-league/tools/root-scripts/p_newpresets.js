(function(){
  var want = { covenant_of_new_jerusalem: ['soudarion_cortege','popinjay_guild','chonae_wing'], runeforge_directorate: ['magdeburg_warhost'] };
  var savedF = G.playerFactions, savedForm = G.formations, savedSaved = _armoryGetSaved, out = [];
  _armoryGetSaved = function() { return []; };
  try {
    Object.keys(want).forEach(function(fac) {
      want[fac].forEach(function(id) {
        G.playerFactions = ['iron_imperium', fac]; G.formations = [null, null];
        _applyAIFormation(1, 'preset:' + id);
        var f = G.formations[1];
        var p = _presetArmiesForFaction(fac).filter(function(x){ return x.id === id; })[0];
        var rp = f.units.reduce(function(s,u){ return s + (u.rp || u.cost || 0); }, 0);
        var viol = typeof rosterTierViolations === 'function' ? rosterTierViolations(f.units) : [];
        out.push(id + ': units ' + f.units.length + ', leaderMap ' + JSON.stringify(f.leaderMap) + ' (preset ' + JSON.stringify(p.leaderMap) + '), marshal ' + f.marshalIndex + ' ' + (f.units[f.marshalIndex]||{}).name + ', subfaction ' + f.subfactionId + ', RP ' + rp + ', tier violations ' + viol.length);
      });
    });
  } finally { G.playerFactions = savedF; G.formations = savedForm; _armoryGetSaved = savedSaved; }
  console.log(out.join('\n'));
})();
