import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'engine/modules/edition/faction_resource_pools.js': [
  ('''// ── Gain trigger: a friendly unit destroyed by the enemy ─────────────────────
// Every pool whose gain[] names 'friendly_unit_destroyed_by_enemy' gains when an
// enemy-controlled attack, ability, rite or combat effect destroys one of its
// holder's units. A joined CHARACTER and its squad are two units, each counted
// when it dies, and a unit is only ever counted once however many death seams
// report it.''',
   '''// ── Gain trigger: a friendly unit destroyed by the enemy ─────────────────────
// Every pool whose gain[] names 'friendly_unit_destroyed_by_enemy' gains when an
// enemy-controlled attack, ability, rite or combat effect destroys one of its
// holder's units. A joined CHARACTER and its squad destroyed in one activation are
// one unit destroyed, counted once (opts.destruction, pairDestructionAnswered in
// core/joined_units.js; the user's ruling, 2026-10-29); destroyed in two, each
// counts. A unit is only ever counted once however many death seams report it.'''),
  ('''    (def.gain || []).forEach(function(gain) {
      if (!gain || gain.on !== 'friendly_unit_destroyed_by_enemy') return;
      addPool(def.id, unit.player, Number(gain.amount != null ? gain.amount : 1), opts.reason || 'friendly unit destroyed');''',
   '''    (def.gain || []).forEach(function(gain, index) {
      if (!gain || gain.on !== 'friendly_unit_destroyed_by_enemy') return;
      if (pairDestructionAnswered(opts.destruction, 'pool|' + def.id + '|' + index)) return;
      addPool(def.id, unit.player, Number(gain.amount != null ? gain.amount : 1), opts.reason || 'friendly unit destroyed');'''),
 ],
 'engine/modules/core/face_dice/triggers.js': [
  ('''function faceDiceObserve(event, unit) {
  var hit = _faceDieForEvent(event, unit);
  if (!hit || !playerHasFaceDie(hit.player, hit.face)) return;''',
   '''// `destruction`: how a death counts (destructionCount, core/joined_units.js) - a
// joined pair destroyed in one activation is one unit destroyed, offered once.
function faceDiceObserve(event, unit, destruction) {
  var hit = _faceDieForEvent(event, unit);
  if (!hit || !playerHasFaceDie(hit.player, hit.face)) return;
  if (pairDestructionAnswered(destruction, 'face_die|' + event + '|' + hit.player + '|' + hit.face)) return;'''),
 ],
 'engine/modules/ai/missions/death_vp.js': [
  ('''// Run `fn` with `unit` and the unit joined to it gone, and - when `death` names the
// side that killed it - its deaths recorded in this round's Primary destroyed list.
function _aiWithUnitGone(unit, death, fn) {
  var members = footprintMembers(unit);
  var state = G.primaryMissions;
  var saved = state ? state.destroyed : null;
  members.forEach(function(m) { m.alive = false; });
  if (state && death) {
    state.destroyed = (saved || []).concat(members.map(function(m) {
      return { round: G.round, killer: death.player, killerUid: death.killer ? death.killer.uid : null,
        uid: m.uid, player: m.player, col: m.col, row: m.row };
    }));
  }''',
   '''// Run `fn` with `unit` and the unit joined to it gone, and - when `death` names the
// side that killed it - its deaths recorded in this round's Primary destroyed list,
// each under the key the engine would count it by (destructionCountKey): a pair
// destroyed together is one unit destroyed, so ERADICATE THE FOE and BLEED THEM WHITE
// read the pair as one kill, as they score it.
function _aiWithUnitGone(unit, death, fn) {
  var members = footprintMembers(unit);
  var state = G.primaryMissions;
  var saved = state ? state.destroyed : null;
  var keys = members.map(destructionCountKey);
  members.forEach(function(m) { m.alive = false; });
  if (state && death) {
    state.destroyed = (saved || []).concat(members.map(function(m, i) {
      return { round: G.round, killer: death.player, killerUid: death.killer ? death.killer.uid : null,
        uid: m.uid, countKey: keys[i], player: m.player, col: m.col, row: m.row };
    }));
  }'''),
 ],
}
for p, pairs in edits.items():
    path = os.path.join(ROOT, p)
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70])
        s = s.replace(old, new)
    open(path, 'w').write(s)
print('ok')
