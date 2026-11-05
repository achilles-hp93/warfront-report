import os, json
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
edits = {
 'doc/shared-fantasy-mechanics-deep-dive.md': [
  ('''Detach ends the pair and steps the CHARACTER onto an adjacent free square. A member's
destruction ends it too (`endJoinedPair`, called by `applyUnitDestruction`); the survivor
stands on the square alone, and a CHARACTER's death forces a Morale Test on its squad.
''', '''Detach ends the pair and steps the CHARACTER onto an adjacent free square. A member's
destruction ends it too (`endJoinedPair`, called by `applyUnitDestruction`); the survivor
stands on the square alone, and a CHARACTER's death forces a Morale Test on its squad.

A pair destroyed in a single activation is one unit destroyed (the user's rulings of
2026-10-29). `applyUnitDestruction` asks `destructionCount` (`core/joined_units.js`) once
per death, before anything answers it: a unit that dies joined counts under its pair's key
(`destructionCountKey`), and so does its partner when it dies in the same activation
(`_pairDeathMoment`: the Battle Round, the phase and `G.unitActivationSeq`, the number
the engine keeps for one Morale Test per activation - a Reaction falls in the activation
it answers; outside activations, a Command Phase turn or a phase's end is one window).
Every counter of the destroyed counts keys: the missions' `event_count`
(`_missionPairCountedAlready`), the Action Phase's kill count, `G.destroyedThisRound`, the
Primaries' destroyed list (`countDestroyedUnits`), and the AI's death value, which records
a pair's two deaths under the same key (`_aiWithUnitGone`, `ai/missions/death_vp.js`).
Every rule that answers a destroyed unit answers the pair once, through the death's
`destruction` (`pairDestructionAnswered`): each event effect on `unit_destroyed`,
`ally_destroyed` and `enemy_unit_destroyed` (`_fireDefinitionEventEffects`,
`abilities/runtime/events.js` - Abyssal Hunger, Famine-Born, Geras-Grasping, Slave To
Cupidity's Gold, Grogh's Tally, Inspiring Triumph, Skyla-Stripper), a pool fed by friendly
losses (Martyred Blood, `awardResourcePoolsForUnitDestroyed`) and the League's Omen of a
friendly death (`faceDiceObserve`). Each answers at the first of the pair's deaths its own
gates accept, so a rule about a destroyed CHARACTER still answers a pair whose squad fell
first. A pair whose CHARACTER fell in one activation and its squad in a later one is two
units destroyed.
'''),
  ('''Individual model losses do not award tokens; a joined CHARACTER and its squad are two units, and each awards its token when it is destroyed.''',
   '''Individual model losses do not award tokens; a joined CHARACTER and its squad destroyed in the same activation award 1 token between them (one unit destroyed, `pairDestructionAnswered`), and destroyed in different activations, each awards its own.'''),
 ],
 'doc/editions/fantasy/core-rule.md': [
  ('''Each unit still adds its own OC, and a destroyed CHARACTER is still a destroyed unit.''',
   '''Each unit still adds its own OC, and a destroyed CHARACTER is still a destroyed unit. A pair whose two units are destroyed in a single activation is one unit destroyed: every rule that counts destroyed units, and every rule that acts each time a unit is destroyed or destroys an enemy unit, counts it once, when either of its units meets what the rule asks. A unit destroyed by a Reaction is destroyed in the activation it reacts to; outside an activation, a player's turn of the Command Phase, or the end of a phase, counts as one activation. A CHARACTER destroyed in one activation and its squad in another are two units destroyed.'''),
 ],
}
for p, pairs in edits.items():
    path = os.path.join(ROOT, p)
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70])
        s = s.replace(old, new)
    open(path, 'w').write(s)

# The Martyred Blood desc (JSON string).
p = os.path.join(ROOT, 'data/editions/fantasy/factions/covenant_of_new_jerusalem/order_of_the_true_cross/subfaction.json')
s = open(p).read()
old = "- A joined unit with an attached LEADER grants at most 1 token when the battlefield unit is destroyed. Individual model losses within that joined unit do not grant tokens."
new = "- A joined CHARACTER and its squad destroyed in the same activation are one unit destroyed and grant 1 token between them; destroyed in different activations, each grants its own. Individual model losses do not grant tokens."
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w').write(s)
json.loads(s)
print('ok')
