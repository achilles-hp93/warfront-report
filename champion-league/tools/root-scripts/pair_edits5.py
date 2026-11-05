import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'engine/modules/combat/attack_activation.js': [
  ('''function endAttackActivation() {
  var state = _activationState();
  if (!state) return;
  state._attackActivationDepth = Math.max(0, state._attackActivationDepth - 1);
  if (state._attackActivationDepth === 0) state._attackActivationId = null;
}
''', '''function endAttackActivation() {
  var state = _activationState();
  if (!state) return;
  state._attackActivationDepth = Math.max(0, state._attackActivationDepth - 1);
  if (state._attackActivationDepth > 0) return;
  state._attackActivationId = null;
  _runAfterThisAttack(state);
}

// ── What waits for the attack to end ─────────────────────────────────────────
// A consequence that must not be set off until the attack that caused it has
// resolved, because the attack can still undo its cause: a slain leader's
// LEADERLESS and Morale Test (edition/fantasy/composition/allocation.js) wait, so a
// death response that puts its unit back as the attack found it (Agnus Dei's
// restore) resolves first - the user's ruling, 2026-10-29: "that should be resolved
// before leaderless and morale test being set off". Each runs once the outermost
// attack activation has ended, in the order it was deferred, outside the attack
// (attackActivationStamp() is null by then). The queue lives on G beside the depth,
// for this runtime's attack only, and goes with it.

// Run `fn` once the attack resolving has ended. Returns false outside an attack,
// when there is nothing to wait for and the caller acts at once.
function afterThisAttack(fn) {
  var state = _activationState();
  if (!state || !state._attackActivationDepth) return false;
  (state._afterAttack || (state._afterAttack = [])).push(fn);
  return true;
}

function _runAfterThisAttack(state) {
  var queue = state._afterAttack;
  if (!queue || !queue.length) return;
  state._afterAttack = [];
  queue.forEach(function(fn) { fn(); });
}
'''),
  ('''    endAttackActivation: endAttackActivation,''',
   '''    endAttackActivation: endAttackActivation,
    afterThisAttack: afterThisAttack,'''),
 ],
 'engine/modules/edition/fantasy/composition/allocation.js': [
  ('''/** Handle leader model death through its declarative on-death effects. */
function _handleLeaderDeath(unit, leader, log) {
  if (leader.onDeath && Array.isArray(leader.onDeath.effects)) {
    runDefinitionEffects(unit, {
      id: 'leader_death', name: leader.name + ' killed', effects: leader.onDeath.effects,
    }, unit, {}, { source: 'model_death:' + leader.modelId, sourceName: leader.name + ' killed' });
  }
  log('  ' + unit.name + ' has lost its leader - LEADERLESS');
}
''', '''/**
 * Handle leader model death through its declarative on-death effects (the unit
 * data's `on_death`: a "Leader slain" Morale Test and LEADERLESS). A leader slain by
 * an attack sets them off once the attack has resolved (afterThisAttack,
 * combat/attack_activation.js), and only if it is still dead then: a rule that put
 * its unit back as the attack found it (Agnus Dei's restore) resolves first, and a
 * leader it put back never set them off (the user's ruling, 2026-10-29). Outside an
 * attack they follow at once.
 */
function _handleLeaderDeath(unit, leader, log) {
  if (afterThisAttack(function() {
    if (leader.alive === false) _leaderDeathConsequences(unit, leader, battleLog);
  })) return;
  _leaderDeathConsequences(unit, leader, log);
}

function _leaderDeathConsequences(unit, leader, log) {
  if (leader.onDeath && Array.isArray(leader.onDeath.effects)) {
    runDefinitionEffects(unit, {
      id: 'leader_death', name: leader.name + ' killed', effects: leader.onDeath.effects,
    }, unit, {}, { source: 'model_death:' + leader.modelId, sourceName: leader.name + ' killed' });
  }
  log('  ' + unit.name + ' has lost its leader - LEADERLESS');
}
'''),
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
