(function() {
  var out = {};
  _withCleanBoard(function() {
    G.playerFactions = ['duat_dominion', 'iron_imperium'];
    G.players[0].factionId = 'duat_dominion';
    G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 3; G.activePlayer = 0; G.objectives = [];
    ensureFantasyMagicState(); G.mana = [20, 10];
    var nomarch = _place(createUnit('duat_dominion:nomarch', 0), 4, 4);
    var priest = _place(createUnit('duat_dominion:canopic_priest', 0), 3, 6);
    var friend = _place(createUnit('duat_dominion:skeletal_spearman', 0), 6, 5);
    var friend2 = _place(createUnit('duat_dominion:skeletal_archer', 0), 7, 5);
    var foe = _place(createUnit('iron_imperium:legionnaire_squad', 1), 4, 7);
    var foe2 = _place(createUnit('iron_imperium:legionnaire_squad', 1), 5, 7);
    [nomarch, priest].forEach(function(u) { u.ap = 1; u.moved = false; u.attacked = false; u.usedAction = false; });
    G.markers = [
      { kind: 'soul_marker', col: 2, row: 2, player: 0, unitUid: 901, templateId: 'duat_dominion:skeletal_spearman' },
      { kind: 'soul_marker', col: 2, row: 3, player: 0, unitUid: 902, templateId: 'duat_dominion:skeletal_archer' },
      { kind: 'soul_marker', col: 3, row: 2, player: 0, unitUid: 903, templateId: 'duat_dominion:skeletal_spearman' },
    ];
    var show = function(c) {
      var t = c.target;
      var tk = !t ? '-' : Array.isArray(t) ? t.length + ' markers' : (t.name || (t.col + ',' + t.row));
      return c.rite.id + (c.castOpts && c.castOpts.oversoul ? ' [OS]' : '') + (c.castOpts && c.castOpts.summonChoice ? ' {' + c.castOpts.summonChoice + '}' : '') + ' -> ' + tk + ' ' + c.score.toFixed(3) + (c.oversoulManaPrice != null ? ' (mana price ' + c.oversoulManaPrice.toFixed(3) + ')' : '');
    };
    var run = function(u) {
      AI._planRevision = (AI._planRevision || 0) + 1; _aiResetMoveEvalCache();
      return aiWithMoveEvalCache(function() {
        return _aiCollectRiteActions(u).map(show);
      });
    };
    out.rites = getAvailableRites(nomarch).map(function(r) { return r.id; });
    out.nomarch20 = run(nomarch);
    out.priest20 = run(priest);
    G.mana = [8, 10];
    out.nomarch8 = run(nomarch);
    out.each8 = aiWithMoveEvalCache(function() { return [aiManaWorthEach(nomarch, 1), aiManaWorthEach(nomarch, 2), aiManaWorthEach(nomarch, 3)]; });
    G.mana = [20, 10];
    AI._planRevision++; _aiResetMoveEvalCache();
    var best = aiWithMoveEvalCache(function() { return _aiCollectRiteActions(nomarch).filter(function(c) { return c.castOpts && c.castOpts.oversoul; }).sort(function(a, b) { return b.score - a.score; })[0]; });
    if (best) {
      var act = _aiCandidateAction(best, 0);
      out.action = act;
      out.valid = validateRegisteredAction(act);
    }
  });
  return out;
})()
