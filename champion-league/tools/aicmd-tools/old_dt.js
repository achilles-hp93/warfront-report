// The fix patched out: aiExtraMoveWorth as it was (the walk and charge read on their own).
aiExtraMoveWorth = function(unit, extraMove, ctx) {
  if (!unit || !unit.alive || unit.col < 0 || !(extraMove > 0)) return 0;
  if (unitInZOC(unit)) return 0;
  var walk = _aiExtraMoveWalk(unit, extraMove);
  var charge = _aiExtraMoveCharge(unit, extraMove, ctx);
  return Math.max(0, Math.max(walk.with, charge.with) - Math.max(walk.without, charge.without));
};
