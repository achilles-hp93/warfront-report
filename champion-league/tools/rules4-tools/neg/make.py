import os
here = os.path.dirname(os.path.abspath(__file__))
frags = {
 'a': ("""function meleeMSThreshold(atkMS, defMS) {
  return d6ContestThreshold(Math.max(0, Number(atkMS) || 0), Math.max(0, Number(defMS) || 0));
}""", """function meleeMSThreshold(atkMS, defMS) {
  if (atkMS <= 0 || defMS <= 0) return 7; // impossible - MS 0 cannot melee
  return d6ContestThreshold(atkMS, defMS);
}"""),
 'b': ("""    var ms = Stats.model(unit, user, 'MS');
    if (!(ms.base > 0)) return null;
    var value = ms.value;""", """    var value = Stats.model(unit, user, 'MS').value;
    if (!(value > 0)) return null;"""),
 'c': ("""  if (pending.asCharge && unit.alive) {
    lockRangedAfterCharge(unit);
    var chargeTargets = getChargeTargets(unit, col, row);
    if (chargeTargets.length) chargeEffects = resolveChargeOnArrival(unit, col, row, chargeTargets);
  }""", """  if (pending.asCharge && unit.alive) {
    var chargeTargets = getChargeTargets(unit, col, row);
    if (chargeTargets.length) {
      markCharge(unit, chargeTargets);
      chargeEffects = applyChargeImpactEffects(unit, col, row);
    }
  }"""),
 'd': ("""function spendFallBackAPt(unit) {
  footprintMembers(unit).forEach(function(member) {""", """function spendFallBackAPt(unit) {
  [unit].forEach(function(member) {"""),
 'e': ("""  var gone = footprintMembers(leaving);""", """  var gone = [leaving];"""),
}
for k, (new, old) in frags.items():
    open(os.path.join(here, k + '.new'), 'w').write(new)
    open(os.path.join(here, k + '.old'), 'w').write(old)
print('ok')
