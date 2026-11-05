import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'doc/editions/fantasy/core-rule.md': [
  ('''- **INI:** Initiative. Higher INI strikes first in melee. A unit uses the lowest INI among its surviving models.''',
   '''- **INI:** Initiative. Higher INI strikes first in melee. A unit uses the lowest INI among its surviving models; a joined pair, the lowest among both units' surviving models (see Joined units).'''),
  ('''**Joined units.** A CHARACTER that joins a squad (see Attach And Detach) and that squad are two units that share one square. They move together, are targeted together and share hit allocation; otherwise each is its own unit, with its own models, HP, characteristics, tags, weapons, abilities, gear, APt, activation and Reactions.''',
   '''**Joined units.** A CHARACTER that joins a squad (see Attach And Detach) and that squad are two units that share one square. They move together, are targeted together, share hit allocation and have one MOVE, one MORALE and one INI; otherwise each is its own unit, with its own models, HP, other characteristics, tags, weapons, abilities, gear, APt, activation and Reactions.'''),
  ('''Advance, Fall Back and Charge count for both units. A pair that Falls Back takes one Fall Back test between them; when a failed test's damage destroys one of its units, the survivor still makes the move.''',
   '''Advance, Fall Back and Charge count for both units. A pair that Falls Back takes one Fall Back test between them, at the pair's INI; when a failed test's damage destroys one of its units, the survivor still makes the move.'''),
  ('''- **Morale.** The pair has one MORALE, the better of the two units', and takes one Morale Test between them, with the better of their Morale Test modifiers. What the test does - SUPPRESSED, a passed test that removes it - applies to both units.''',
   '''- **Morale.** The pair has one MORALE, the better of the two units', and takes one Morale Test between them, with the better of their Morale Test modifiers. What the test does - SUPPRESSED, a passed test that removes it - applies to both units.
- **Initiative.** The pair has one INI, the lower of the two units', wherever a rule reads INI: each of its units strikes and counterattacks at it in melee, the pair takes its Fall Back test at it, and an enemy unit Falling Back from the pair compares its INI with it. Each unit reads its own models with its own modifiers, and the pair takes the lowest. A Charge's +3 INI is still each unit's own, for its first melee attack.'''),
  ('''When the attack is aimed at a joined pair, each of its two units makes this choice for itself, pays its own cost and strikes at its own INI.''',
   '''When the attack is aimed at a joined pair, each of its two units makes this choice for itself, pays its own cost and strikes at the pair's INI (see Joined units).'''),
 ],
 'doc/shared-fantasy-mechanics-deep-dive.md': [
  ('''  A pair's Fall Back is its squad's: one FALL BACK test, at the squad's INI (the catalog
  shares only MOVE and MORALE across a pair), and when its 1D3 destroys the squad the''',
   '''  A pair's Fall Back is its squad's: one FALL BACK test, at the pair's INI (the lower of
  its two units', the catalog's shared INI below), and when its 1D3 destroys the squad the'''),
  ('''- They share MOVE (the lower) and MORALE (the better): the catalog's `joined_pair`
  aggregation, read by `Stats.unit`.''',
   '''- They share MOVE (the lower), MORALE (the better) and INI (the lower): the catalog's
  `joined_pair` aggregation, read by `Stats.unit` over both units' living models, each read
  with its own unit's modifiers. INI is shared since 2026-10-29 (the user's ruling: the
  lower INI is the pair's, everywhere): every INI reader goes through `_effectiveMeleeINI`
  (`edition/fantasy/melee/initiative.js`) over `Stats.unit`, so the attacker of a pair, each
  counterattacking unit of a defending pair (`_meleeExchangeStrikers`), the pair's FALL BACK
  test and the pair as an enemy holding a unit that falls back (`fallBackTestOdds`), the
  AI's charge order (`aiChargeStrikesFirst`) and melee exchange (`aiMeleeAttackExchange`)
  and its Fall Back price (`fallBackFailureCost`) all read the pair's INI. INI auras
  (Soporific Censer, Lulling Fumes) are a Stats contributor (`aura:model_stat`,
  `combat/aura_engine.js`), added after the cap as melee initiative always added them; a
  CHARGE's +3 stays each unit's own (`_chargeIniBonusAvailable`).'''),
  ('''- Everything else is each unit's own: models, HP, abilities, gear, rites, APt, activation
  in the Action Phase and reactions. A melee defender pair strikes back unit by unit.''',
   '''- Everything else is each unit's own: models, HP, abilities, gear, rites, APt, activation
  in the Action Phase and reactions. A melee defender pair strikes back unit by unit, each
  at the pair's INI.'''),
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
