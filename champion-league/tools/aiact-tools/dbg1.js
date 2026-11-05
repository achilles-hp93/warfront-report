(function() {
  var out = {};
  _withCleanBoard(function() {
    AI.player = 0;
    G.battlePhase = 'MOVEMENT'; G.round = 1; G.activePlayer = 0;
    G.objectives = [{ id: 'obj0', col: 7, row: 4, holder: null }];
    var gun = _place(createUnit('covenant_of_new_jerusalem:saint_barbara_field_gun', 0), 7, 13);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 9, Math.max(0, 13 - _aiCachedEffectiveRange(gun) - getEffectiveMove(gun)));
    var riders = _place(createUnit('iron_imperium:legionnaire_squad', 0), 3, 13);
    out.gunRange = _aiCachedEffectiveRange(gun); out.gunMove = getEffectiveMove(gun);
    out.ridersRange = _aiCachedEffectiveRange(riders); out.ridersMove = getEffectiveMove(riders);
    out.foe = [foe.col, foe.row];
    out.riderWeapons = Weapons.groups(riders, 'ranged').map(function(g) { return g.weapon.name + ' ' + Weapons.activeTags(riders, g.weapon).join(','); });
    out.gunWeapons = Weapons.groups(gun, 'ranged').map(function(g) { return g.weapon.name + ' ' + Weapons.activeTags(gun, g.weapon).join(','); });
    var spahbed = createUnit('atashid_empire:spahbed', 0);
    out.spahbedMoves = spahbed.moved;
  });
  return out;
})()
