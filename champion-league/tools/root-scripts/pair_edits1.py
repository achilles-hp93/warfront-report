import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'engine/modules/edition/fantasy/melee_resolver.js': [
  ('''// The attacker strikes the unit attacked - a joined pair as one, its hits allocated
// across both units' models. Each unit of the defending footprint strikes back on
// its own: it chooses to, spends its own 1 APt (melee/counter_cost.js) and strikes
// at its own INI.''', '''// The attacker strikes the unit attacked - a joined pair as one, its hits allocated
// across both units' models. Each unit of the defending footprint strikes back on
// its own: it chooses to and spends its own 1 APt (melee/counter_cost.js), and
// strikes at the pair's INI, the lower of its two units' (melee/initiative.js).'''),
 ],
 'engine/modules/core/stats.js': [
  ('''    // A characteristic a joined pair shares (catalog `joined_pair: "shared"`: MOVE,
    // MORALE) is aggregated over both units' living models, each model read as its
    // own unit's (core/joined_units.js); any other is the unit's alone.''', '''    // A characteristic a joined pair shares (catalog `joined_pair: "shared"`: MOVE,
    // MORALE, INI) is aggregated over both units' living models, each model read as
    // its own unit's (core/joined_units.js); any other is the unit's alone.'''),
 ],
 'engine/modules/core/joined_units.js': [
  ('''// the square, every move, the pair's MOVE and MORALE, being targeted, hit''',
   '''// the square, every move, the pair's MOVE, MORALE and INI, being targeted, hit'''),
 ],
 'generator/rules_catalog.py': [
  ('''            # models (core/stats.js, core/joined_units.js) - MOVE, MORALE.''',
   '''            # models (core/stats.js, core/joined_units.js) - MOVE, MORALE, INI.'''),
 ],
 'engine/modules/core/movement/fall_back_test.js': [
  ('''// The INI the test compares: the unit's melee INI without a CHARGE's +3, which
// belongs to its first melee attack only.''', '''// The INI the test compares: the unit's melee INI without a CHARGE's +3, which
// belongs to its first melee attack only. A joined pair's is the pair's, the lower
// of its two units' (melee/initiative.js), for the pair's one test and as a holder.'''),
 ],
}
for p, pairs in edits.items():
    path = os.path.join(ROOT, p)
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:50])
        s = s.replace(old, new)
    open(path, 'w').write(s)
print('ok')
