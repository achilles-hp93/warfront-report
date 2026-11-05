import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'doc/shared-fantasy-mechanics-deep-dive.md': [
  ('''  only morale step was that Below Half-Strength test, so MORALE BREAKER never fired in
  melee.
''', '''  only morale step was that Below Half-Strength test, so MORALE BREAKER never fired in
  melee.
- **A slain leader waits for the attack:** a squad's leader model carries its death's
  consequences as data (`on_death`: `force_test` "Leader slain" and `apply_status`
  LEADERLESS), run by `_handleLeaderDeath` (`edition/fantasy/composition/allocation.js`)
  from `afterModelKilled`. A leader slain by an attack sets them off once the attack has
  resolved - the core rules' Aftermath - through `afterThisAttack`
  (`combat/attack_activation.js`, run when the outermost attack activation ends), and
  only if the leader model is still dead then (2026-10-29, the user's ruling). A death
  response that puts the unit back as the attack found it (Agnus Dei's
  `restore_antiphon_survival`, which restores the models the attack's start kept) has
  resolved by then, so a leader it put back never set them off; nothing in the death
  pipeline names Agnus Dei. Outside an attack (a failed Fall Back, a hazard) they follow
  at once. A side effect: a defender whose leader falls to the attacker's strike now
  counterattacks before its "Leader slain" test, which used to be taken mid-exchange.
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
