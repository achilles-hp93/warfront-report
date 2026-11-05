// Scratch page probe (not committed): what the AI weighed for the pool spends and gains.
// Wraps the AI's own candidate builders, reads only what they return, changes nothing.
(function() {
  var R = window.__battleRecord;
  R.hq = []; R.picks = [];
  var name = function(t) { return t ? (t.name || (t.templateId) || (t.col != null ? t.col + ',' + t.row : null)) : null; };
  var hqOrig = window.aiBuildHQCommandCandidates;
  window.aiBuildHQCommandCandidates = function(player) {
    var out = hqOrig.apply(this, arguments);
    try {
      var entry = { round: G.round, player: player, loots: getPool('loots', player), cp: G.players[player].cp,
        candidates: out.map(function(c) { return [c.cmd.name, name(c.target), Math.round(c.weight * 100) / 100]; }) };
      // Liquidate Assets' own price, offered or not: its surge, its Loots, the two together.
      var hq = G.units.find(function(u) { return u.isHQ && u.player === player && u.alive; });
      var cmd = hq && (hq.commands || []).find(function(c) { return c && c.name === 'Liquidate Assets'; });
      if (cmd && getPool('loots', player) >= 10) {
        entry.liquidate = aiWithMoveEvalCache(function() {
          var ctx = { player: player, cmd: cmd, friendlies: _aiCommandFriendlies(player), enemies: _aiCommandEnemies(player) };
          var surge = aiCommandEffectValue(cmd.effects[0], null, ctx);
          var cost = aiPoolCostValue(cmd.resource.cost, player, 'command');
          return [Math.round(surge * 100) / 100, Math.round(cost * 100) / 100, Math.round((surge + cost) * 100) / 100];
        });
      }
      R.hq.push(entry);
    } catch (e) { R.hq.push({ error: String(e) }); }
    return out;
  };
  var last = {};
  var collectOrig = window._aiCollectActions;
  window._aiCollectActions = function(unit) {
    var out = collectOrig.apply(this, arguments);
    if (unit) last[unit.uid] = out;
    return out;
  };
  var chooseOrig = window.aiChooseActionPhase;
  window.aiChooseActionPhase = function(player) {
    last = {};
    var out = chooseOrig.apply(this, arguments);
    try {
      var best = out.best;
      Object.keys(last).forEach(function(uid) {
        var cands = last[uid] || [];
        var pool = cands.filter(function(c) {
          return c.type === 'ability' && c.ability && /Plunder|Inscribe|Greed/.test(c.ability.name);
        });
        if (!pool.length) return;
        var top = cands.slice().sort(function(a, b) { return b.score - a.score; }).slice(0, 4);
        R.picks.push({ round: G.round, player: player, unit: cands[0].unit.name, loots: getPool('loots', player),
          chosen: best && best.unit === cands[0].unit ? [best.type, best.ability ? best.ability.name : null, name(best.target), best.abilityOpts && best.abilityOpts.runeId, Math.round(best.score * 100) / 100] : (best ? 'another unit: ' + best.unit.name : 'pass'),
          top: top.map(function(c) { return [c.type, c.ability ? c.ability.name : null, name(c.target), c.abilityOpts && c.abilityOpts.runeId, Math.round(c.score * 100) / 100]; }) });
      });
    } catch (e) { R.picks.push({ error: String(e) }); }
    return out;
  };
})();
