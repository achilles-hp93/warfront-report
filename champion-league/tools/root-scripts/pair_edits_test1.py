import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'tests/suites/ops/aura.js': [
  ('''//   - the PER and attack_rate channels the engine bridges itself;''',
   '''//   - the PER, INI and attack_rate channels the engine bridges itself: an INI aura
//     is read through Stats (melee initiative reads it there, once), after the cap on
//     INI's other modifiers, and a joined pair's INI is the lower of its units' own;'''),
  ('''status denial, the PER and attack_rate bridges, malformed auras throw', fn() {''',
   '''status denial, the PER, INI and attack_rate bridges, malformed auras throw', fn() {'''),
  ('''      def(A, 'weight', [aura('', { channel: 'attack_rate', side: 'enemies', range: 1, amount: -1 })]);''',
   '''      def(A, 'weight', [aura('', { channel: 'attack_rate', side: 'enemies', range: 1, amount: -1 })]);
      def(A, 'lull', [aura('', { channel: 'ini', side: 'enemies', range: 1, amount: -2, label: 'OPAURA LULL' })]);'''),
  ('''        // ── 11. The channels the engine bridges itself: PER and attack_rate ──''',
   '''        // ── 11. The channels the engine bridges itself: PER, INI and attack_rate ──'''),
  ('''        G.units = [];
        carry(unit(1, 5, 5), 'weight');''',
   '''        // INI (2026-10-29): read through Stats, so a joined pair's INI - the lower of
        // its two units' - is read with each unit's own aura; melee initiative adds
        // nothing of its own; the aura is added after the cap on INI's other modifiers.
        G.units = [];
        carry(unit(1, 5, 5), 'lull');
        var lulled = unit(0, 5, 6), awake = unit(0, 5, 9);
        var ini0 = Stats.unit(awake, 'INI').value, lulledIni = Stats.unit(lulled, 'INI');
        if (lulledIni.value !== ini0 - 2) return 'an ini aura of -2 lowers INI through Stats, got ' + ini0 + ' -> ' + lulledIni.value;
        if (!lulledIni.modifiers.some(function(m) { return m.sourceName === 'OPAURA LULL'; })) return 'the INI record is named by the aura\\'s label';
        if (_effectiveMeleeINI(lulled).total !== ini0 - 2) return 'melee initiative reads the aura once, through Stats, got ' + _effectiveMeleeINI(lulled).total;
        runOp({ op: 'mod_stat', stat: 'ini', amount: -2 }, { unit: lulled, targets: [lulled], source: 'probe' });
        if (Stats.unit(lulled, 'INI').value !== ini0 - 4) return 'the aura is added after the cap on INI\\'s other modifiers, got ' + Stats.unit(lulled, 'INI').value;
        G.units = [];
        carry(unit(1, 5, 5), 'weight');'''),
 ],
}
for p, pairs in edits.items():
    path = os.path.join(ROOT, p)
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:60])
        s = s.replace(old, new)
    open(path, 'w').write(s)
print('ok')
