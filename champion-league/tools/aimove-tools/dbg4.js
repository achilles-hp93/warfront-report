(function() {
  var out = {};
  _withCleanBoard(function() {
    setBoardFromMap(MAPS_DATA.filter(function(m) { return m.name === 'CROSSROADS'; })[0]);
    G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 2; G.activePlayer = 0; AI.player = 0;
    G.players = [{ factionId: 'covenant_of_new_jerusalem', subfactionId: 'order_of_the_pierced_laurel', vp: 0, cp: 0, missions: [] }, { factionId: 'iron_imperium', vp: 0, cp: 0, missions: [] }];
    G.formations = [{ factionId: 'covenant_of_new_jerusalem', subfactionId: 'order_of_the_pierced_laurel' }, { factionId: 'iron_imperium' }];
    var sniper = _place(createUnit('covenant_of_new_jerusalem:sniper_hesychast', 0), 6, 11);
    var gun = _place(createUnit('covenant_of_new_jerusalem:saint_barbara_field_gun', 0), 9, 12);
    var levies = _place(createUnit('covenant_of_new_jerusalem:covenant_levies', 0), 3, 11);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 7, 4);
    AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
    [sniper, gun, levies].forEach(function(u) {
      var bd = aiScoreDestinationBreakdown(u, { col: u.col, row: u.row });
      out[u.name] = { penalty: _aiMoveFirePenalty(u), range: _aiCachedEffectiveRange(u), standing: _aiStandingFireShare(u),
        roles: aiUnitRoleTags(u), offensive: bd.offensive, rangeTerm: bd.range,
        pick: (function() { var p = _aiPickDestination(u); return p ? [p.col, p.row, Math.round(p.score*100)/100] : null; })(),
        stay: Math.round(bd.total * 100) / 100 };
    });
    _aiClearMoveEvalCache();
  });
  return out;
})()
