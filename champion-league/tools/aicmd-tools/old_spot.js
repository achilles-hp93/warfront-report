// The fix patched out: the base build's Scouting Order reading.
_aiCommandNewSpotCount = function(unit, perBonus, enemies) {
  if (!unit || !unit.alive || unit.col < 0) return 0;
  var others = _aiCommandFriendlies(unit.player).filter(function(f) {
    return f.col >= 0 && !isStructure(f) && footprintMembers(unit).indexOf(f) < 0;
  });
  var unseen = (enemies || _aiCommandEnemies(unit.player)).filter(function(enemy) {
    return enemy.alive && enemy.col >= 0 && !(enemy.statuses && enemy.statuses.includes(STATUS_HIDDEN))
      && !isSpotted(unit.player, enemy.col, enemy.row, enemy)
      && !others.some(function(f) { return chebyshev(f.col, f.row, enemy.col, enemy.row) <= getEffectivePER(f) + getMovementPoints(f); });
  });
  if (!unseen.length) return 0;
  var per = getEffectivePER(unit);
  var squares = [{ col: unit.col, row: unit.row }];
  var likely = aiChooseDestination(unit, reachableSquares(unit, 0), { greedy: true });
  if (likely && (likely.col !== unit.col || likely.row !== unit.row)) squares.push({ col: likely.col, row: likely.row });
  var shooters = _aiCommandFriendlies(unit.player).filter(function(f) { return Weapons.groups(f, 'ranged').length > 0; });
  return unseen.filter(function(enemy) {
    var onlyWithBonus = squares.some(function(sq) {
      return seesSquareFrom(sq, per + (perBonus || 0), enemy.col, enemy.row, enemy)
        && !seesSquareFrom(sq, per, enemy.col, enemy.row, enemy);
    });
    return onlyWithBonus && shooters.some(function(f) {
      var reach = Weapons.groups(f, 'ranged').reduce(function(most, g) {
        return Math.max(most, getEffectiveWeaponRange(f, g.weapon));
      }, 0);
      return chebyshev(f.col, f.row, enemy.col, enemy.row) <= reach + getMovementPoints(f);
    });
  }).length;
}
;
