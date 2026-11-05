import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'engine/modules/edition/fantasy/composition/allocation.js': [
  (''' * an attack sets them off once the attack has resolved (afterThisAttack,
 * combat/attack_activation.js), and only if it is still dead then: a rule that put
 * its unit back as the attack found it (Agnus Dei's restore) resolves first, and a
 * leader it put back never set them off (the user's ruling, 2026-10-29). Outside an
 * attack they follow at once.
 */
function _handleLeaderDeath(unit, leader, log) {
  if (afterThisAttack(function() {
    if (leader.alive === false) _leaderDeathConsequences(unit, leader, battleLog);
  })) return;''', ''' * an attack sets them off once the attack has resolved (afterThisAttack,
 * combat/attack_activation.js), and only if it is still dead then: a rule that put
 * its unit back as the attack found it (Agnus Dei's restore) resolves first, and a
 * leader it put back never set them off (the user's ruling, 2026-10-29). A unit the
 * attack destroyed has nothing left to set them off on. Outside an attack they
 * follow at once.
 */
function _handleLeaderDeath(unit, leader, log) {
  if (afterThisAttack(function() {
    if (leader.alive === false && unit.alive) _leaderDeathConsequences(unit, leader, battleLog);
  })) return;'''),
 ],
 'doc/editions/fantasy/core-rule.md': [
  ('''happens once the attack has resolved, in its Aftermath, and only if the leader is still destroyed then.''',
   '''happens once the attack has resolved, in its Aftermath, and only if the leader is still destroyed and its unit still stands then.'''),
 ],
 'doc/shared-fantasy-mechanics-deep-dive.md': [
  ('''  (`combat/attack_activation.js`, run when the outermost attack activation ends), and
  only if the leader model is still dead then (2026-10-29, the user's ruling).''',
   '''  (`combat/attack_activation.js`, run when the outermost attack activation ends), and
  only if the leader model is still dead and its unit still stands then (2026-10-29, the
  user's ruling).'''),
 ],
 'tests/suites/death_pipeline/020_a_slain_leader_waits_for_the_attack.js': [
  ('''      // Outside an attack they follow at once.''',
   '''      // A unit the attack destroys, leader and all, has nothing left to set them off on.
      var wiped = _place(createUnit('covenant_of_new_jerusalem:covenant_levies', 0), 3, 4);
      var wipedLeader = leaderOf(wiped);
      beginAttackActivation();
      try {
        Models.applyDamageToModel(wiped, wipedLeader, 99);
        afterModelKilled(wiped, wipedLeader, { attacker: archers });
        Models.destroy(wiped);
      } finally { endAttackActivation(); }
      if (wiped.alive || hasStatus(wiped, 'LEADERLESS')) return 'a unit the attack destroyed is set nothing off';

      // Outside an attack they follow at once.'''),
  ('''test: { name: 'A slain leader sets off its Morale Test and LEADERLESS once the attack has resolved, and nothing when a restore put it back', fn() {''',
   '''test: { name: 'A slain leader sets off its Morale Test and LEADERLESS once the attack has resolved, and nothing when a restore put it back or the unit fell', fn() {'''),
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
