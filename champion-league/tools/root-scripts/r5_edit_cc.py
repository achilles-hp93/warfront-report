p='engine/modules/movement/countercharge.js'
s=open(p).read()
rep=[
("""// When an enemy unit is selected to perform a Charge action against a friendly
// unit (performCharge, movement/charge_action.js, before the roll), its
// defending player may spend the command's CP to have a DIFFERENT friendly unit,
// one able to perform a Charge action against that enemy, do so first:
""","""// When an enemy unit is selected to perform a Charge action against a friendly
// unit (performCharge, movement/charge_action.js, before the roll; a Charge a rule
// grants when its square is picked, core/movement/reposition.js), its
// defending player may spend the command's CP to have a DIFFERENT friendly unit,
// one able to perform a Charge action against that enemy, do so first:
"""),
("""//   3. Its CHARGE is a real one (performCharge, ordered, so it is never itself
//      countercharged): the roll, the move, OVERWATCH and every other reaction
//      to it.""","""//   3. Its CHARGE is a real one (performCharge, ordered): the roll, the move,
//      OVERWATCH and every other reaction to it - but not a Countercharge of its
//      own (countercharge: false), which the rules leave open."""),
("""// The friendly units that may answer `charger`'s CHARGE to (col,row): never a
// unit it charges, and only one that can perform a Charge action against it now.
function counterchargeCandidates(charger, col, row) {
  var charged = getChargeTargets(charger, col, row);
""","""// The units `charger`'s CHARGE to (col,row) is made against: its enemies. A
// compelled CHARGE may end beside its own side too (combat/compelled_attacks.js),
// and no Countercharge answers a Charge against a unit's own side.
function _counterchargeCharged(charger, col, row) {
  return getChargeTargets(charger, col, row).filter(function(t) { return t.player !== charger.player; });
}

// The friendly units that may answer `charger`'s CHARGE to (col,row): never a
// unit it charges, and only one that can perform a Charge action against it now.
function counterchargeCandidates(charger, col, row) {
  var charged = _counterchargeCharged(charger, col, row);
"""),
("""    ordered: true, settleAfterReactions: true, onSettled: finish,""","""    ordered: true, countercharge: false, settleAfterReactions: true, onSettled: finish,"""),
("""  var charged = getChargeTargets(charger, col, row);
  var ctx = {""","""  var charged = _counterchargeCharged(charger, col, row);
  var ctx = {"""),
]
for a,b in rep:
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
open(p,'w').write(s)
