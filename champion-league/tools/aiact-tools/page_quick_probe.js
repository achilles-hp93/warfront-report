// Scratch probe (aiact): units the Action Phase acts with only through a non-attack action
// (no means to attack: 0 APt and no FREE weapon left), and the QUICK uses made at 0 APt.
function installProbe() {
  var P = window.__probe = { actable: [], quickAt0: [], errors: [] };
  var seen = {};
  var actOrig = window.aiActableUnits;
  window.aiActableUnits = function(player) {
    var out = actOrig.apply(this, arguments);
    try {
      out.forEach(function(u) {
        if (!attackerMeansBlockReason(u)) return;
        var key = G.round + ':' + u.uid;
        if (seen[key]) return;
        seen[key] = true;
        P.actable.push({ round: G.round, unit: u.name, player: u.player, ap: u.ap || 0 });
      });
    } catch (e) { P.errors.push(e.message); }
    return out;
  };
  var useOrig = window.useAbility;
  window.useAbility = function(unit, name) {
    try {
      var ab = _findAbility(unit, name);
      if (G.battlePhase === 'ACTION' && ab && ab.phase === 'QUICK' && !((unit.ap || 0) > 0)) {
        P.quickAt0.push({ round: G.round, unit: unit.name, player: unit.player, ability: ab.name });
      }
    } catch (e) { P.errors.push(e.message); }
    return useOrig.apply(this, arguments);
  };
  return 'ok';
}
