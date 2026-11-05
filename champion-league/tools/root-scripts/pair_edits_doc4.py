import os, json
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'doc/editions/fantasy/core-rule.md': [
  ('''MORALE BREAKER, a COMMAND death, a Charge, and specific rules force a Morale Test when they happen, whatever the unit's strength.
''', '''MORALE BREAKER, a COMMAND death, a Charge, and specific rules force a Morale Test when they happen, whatever the unit's strength.

When an attack destroys a squad's leader model, what its datasheet says its death sets off - the "Leader slain" Morale Test and LEADERLESS - happens once the attack has resolved, in its Aftermath, and only if the leader is still destroyed then. A rule that puts the unit back as the attack found it, such as Agnus Dei, resolves first: a leader it puts back was never slain, and neither happens. A leader destroyed outside an attack sets them off at once.
'''),
 ],
 'doc/shared-fantasy-mechanics-deep-dive.md': [],
}
for p, pairs in edits.items():
    path = os.path.join(ROOT, p)
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70])
        s = s.replace(old, new)
    open(path, 'w').write(s)

p = os.path.join(ROOT, 'data/editions/fantasy/magic/covenant_of_new_jerusalem/antiphons/agnus_dei.json')
s = open(p).read()
old = 'Response: It will not be destroyed and stays on the field in the same state before the attack."'
new = 'Response: It will not be destroyed and stays on the field in the same state before the attack. A model the attack destroyed is not destroyed, so a slain leader sets off neither its Morale Test nor LEADERLESS."'
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w').write(s)
json.loads(s)
print('ok')
