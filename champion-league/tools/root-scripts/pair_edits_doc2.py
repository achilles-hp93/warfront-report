import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'doc/plan/fantasy_ver/joined-units-architecture.md': [
  ('''- **Melee as defender:** each member decides, pays its own APt and strikes at its own INI.
- **MOVE and MORALE are the pair's:** one shared MOVE (the lower) and one shared MORALE (the
  better), one Morale Test for the pair, and the CHARACTER's death forces a Morale Test on
  its squad. MOVE is the lower and MORALE the better (confirmed 2026-10-21).''',
   '''- **Melee as defender:** each member decides and pays its own APt; each strikes at the
  pair's INI (2026-10-29, below).
- **MOVE and MORALE are the pair's:** one shared MOVE (the lower) and one shared MORALE (the
  better), one Morale Test for the pair, and the CHARACTER's death forces a Morale Test on
  its squad. MOVE is the lower and MORALE the better (confirmed 2026-10-21).
- **INI is the pair's (2026-10-29):** one shared INI, the lower of the two members', read
  everywhere - each member's strike and counterattack, the pair's one Fall Back test, the
  pair holding an enemy that falls back. The user: "the lower INI is the joint squad INI ...
  it should be universal". A CHARGE's +3 stays each member's own.'''),
  ('''  weapon pools, `castActionPool` and `caster_records.js` are gone. A melee attack on a pair
  draws each unit's own counterattack at its own INI (`_meleeExchangeStrikers`), each
  chosen by its unit (`holdMeleeStrikeUids`, `melee/counter_choice.js`).
- **Shared characteristics:** the catalog's `joined_pair: "shared"` on MOVE and MORALE;
  `Stats.unit` aggregates them over both units.''',
   '''  weapon pools, `castActionPool` and `caster_records.js` are gone. A melee attack on a pair
  draws each unit's own counterattack (`_meleeExchangeStrikers`), each chosen by its unit
  (`holdMeleeStrikeUids`, `melee/counter_choice.js`), at the pair's INI.
- **Shared characteristics:** the catalog's `joined_pair: "shared"` on MOVE and MORALE, and
  on INI since 2026-10-29; `Stats.unit` aggregates them over both units.'''),
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
