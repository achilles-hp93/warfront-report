import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'engine/modules/abilities/runtime/events.js': [
  ('''// The dispatcher resolves each listening effect's targets and runs its op, so
// the behaviour is fully described by the data. Emit points live in the phase
// handlers (checkpoints) and the charge/attack/destroy code (gameplay).
// -----------------------------------------------------------------------------''',
   '''// The dispatcher resolves each listening effect's targets and runs its op, so
// the behaviour is fully described by the data. Emit points live in the phase
// handlers (checkpoints) and the charge/attack/destroy code (gameplay).
//
// A death's events carry how it counts (ctx.destruction, destructionCount in
// core/joined_units.js): a joined pair destroyed in one activation is one unit
// destroyed, so each listening effect answers it once - at the first of its two
// deaths that the effect's own gates accept (the user's ruling, 2026-10-29: Abyssal
// Hunger, Grogh's Tally, Skyla-Stripper and every "each time ... destroys an enemy
// unit" rule had paid twice for one pair).
// -----------------------------------------------------------------------------'''),
  ('''    if (!targets.length) return;
    // On an EVENT effect `when` was the gate, and it has just been answered.''',
   '''    if (!targets.length) return;
    // A pair destroyed together is one unit destroyed: this effect of this unit has
    // answered it already if it answered the pair's other death.
    if (pairDestructionAnswered(ctx.destruction, unit.uid + '|' + event + '|' + sourceId + '|' + e)) return;
    // On an EVENT effect `when` was the gate, and it has just been answered.'''),
  ('''  var records = Grants.records(unit, 'REACTION').filter(function(record) { return record.data.on === event; });
  var ran = 0;
  return ruleEach(records, function(record) {
    var reaction = record.data;''',
   '''  var records = Grants.records(unit, 'REACTION').filter(function(record) { return record.data.on === event; });
  var ran = 0;
  return ruleEach(records, function(record) {
    // A pair destroyed together is one unit destroyed (core/joined_units.js).
    if (pairDestructionAnswered(ctx.destruction, unit.uid + '|reaction|' + event + '|' + record.recordId)) return;
    var reaction = record.data;'''),
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
