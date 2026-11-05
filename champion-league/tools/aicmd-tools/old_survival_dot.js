// Patch-out (scratch): survival without the damage-over-time tick.
_aiObjectiveSurvival = function(unit, col, row) {
  var hp = _aiCurrentHP(unit);
  if (!(hp > 0)) return 1;
  var enemies = _aiCachedAliveUnits(1 - unit.player);
  var seen = _aiSquareWillBeSeen(unit, col, row, enemies);
  var damage = 0;
  for (var i = 0; i < enemies.length; i++) damage += _aiEnemyDamageReaching(unit, enemies[i], col, row, seen);
  if (damage <= 0) return 1;
  return 1 / (1 + Math.pow(damage / hp, AI_SURVIVAL_STEEPNESS));
};
