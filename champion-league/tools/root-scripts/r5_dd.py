p='doc/shared-fantasy-mechanics-deep-dive.md'
s=open(p).read()
reps=[
("""`performCharge` (`movement/charge_action.js`) offers seam `chargeDeclared` for a unit's own Charge, never an ordered one.""",
"""`performCharge` (`movement/charge_action.js`) offers seam `chargeDeclared` for every Charge, an ordered one too (Sabre Signal's run, a compelled Charge), and a granted Charge (`grant_move` `as_charge`: Insatiable Rage) offers it through the same `offerCountercharge` once its square is picked (`_applyGrantedCharge`, `core/movement/reposition.js`) - a Charge a rule grants or compels provokes the Reactions a Charge provokes unless its rule says otherwise (the user's ruling, 2026-10-30: "yes unless stated otherwise"; until then only a unit's own Charge was countercharged). The one exception is a Countercharge's own Charge (`countercharge: false`): whether a Countercharge can itself be countercharged is a question the rules leave open. Only the units the Charge is made against count (`_counterchargeCharged`: its enemies - a compelled Charge may end beside its own side)."""),
("""    missions (`checkMissionsOnCharge`) and fires `charge_complete`. Like every granted
    move it provokes no Reaction (no Overwatch, no Fire After Enemy Charge, no
    Countercharge offer). It deliberately""",
"""    missions (`checkMissionsOnCharge`) and fires `charge_complete`. And it provokes a
    Charge's Reactions (the user's ruling, 2026-10-30: "yes unless stated otherwise";
    until then, like every granted move, it provoked none): `_applyGrantedCharge`
    (`core/movement/reposition.js`) offers the Countercharge once its square is picked
    (`offerCountercharge`; one that lands cancels it, one that fails lets it go on when
    the square can still be reached), locks the ranged weapons, then moves through the
    arrival chain of an ordered Charge (`orderedCharge`): the Charge resolves on arrival,
    then the move's Reactions run - OVERWATCH, then Fire After Enemy Charge
    (`runMoveReactions`), whose once-per-charge mark `lockRangedAfterCharge` clears, so a
    unit's second Charge in a round is heard too. A unit the Reactions destroy has still
    completed its Charge. It deliberately"""),
]
for a,b in reps:
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
open(p,'w').write(s)
