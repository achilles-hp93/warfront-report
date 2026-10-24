# Open decisions - 2026-10-24 (overnight)

Branch `ccr-6962c382-ne55kb`. Everything below is committed and pushed unless it says otherwise.

## 1. Survival-weighted objectives: keep as is, tune, or revert?

Committed as `38f86f78` (`ai/movement/objective_survival.js`). An objective square is worth its
value times `1 / (1 + (damage / HP)^2)`, the damage being every enemy that can move and then
shoot or charge the unit there this round, each enemy's attack shared among the units it can
reach.

The first cut counted every enemy's whole attack on every unit it could reach. That made tough
units afraid of objectives too (Shieldbearers read Round 1's objectives at 0.26-0.46), against
"tough ones barely change". So the fire is now shared, and the Shieldbearers read 0.51-0.92.

Measured on the same seeds, 6 battles each (seeds don't repeat a battle once the AI changes,
so this is a sample, not a replay):

| | Assassin alive at the end | Assassin VP / battle | Assassin charges | Court VP | Opponent VP | Wins |
|---|---|---|---|---|---|---|
| Host vs Court, before | 0/6 | 1.5 | 4 | 20.8 | 28.0 | Host 4-2 |
| Host vs Court, after | 3/6 | 3.8 | 7 | 20.0 | 32.2 | Host 5-1 |
| Penitent vs Court, before | 2/6 | 2.2 | 5 | 28.8 | 21.0 | Court 4-2 |
| Penitent vs Court, after | 1/6 | 2.5 | 9 | 26.7 | 28.3 | Court 4-2 |

The Assassin is better: 4 of 12 survive instead of 2, VP per battle goes from 1.9 to 3.2, and it
makes 16 charges instead of 9. But the Court as an army did not gain, and both of its opponents
scored more. The term applies to every unit on both sides.

Options:
- **Keep it** (current state).
- **Tune it**: a gentler curve (exponent 3, so a unit facing half its HP keeps 0.89 instead of
  0.8), or apply it only to units below some HP.
- **Revert it** and go back to the narrower fixes for the Assassin (its own caution term, as the
  fragile scout has).

## 2. The ten new preset armies: keep, rename, or drop?

Committed as `a909263d`, for tonight's battle reports. Ramesses's Army, Finvarra's Army,
Genghis's Army, Rurik's Army, Saladin's Army, Taichou's Army, Merlin's Army, Herald's Army,
Hakon's Army, Heron's Army: 190-198 RP, the faction's EPIC HERO or senior CHARACTER as Marshal,
no doctrine. The names are placeholders ("<Marshal>'s Army"). They show up in the AI formation
picker for those factions.

## 3. Two LEADER CHARACTERs cannot lead any squad

The Canopic Priest (Duat Dominion) and the Knight-Banneret (British Liberation Front) carry the
LEADER tag but no join restriction, and the game refuses to attach them to anything
("CHARACTER has no join restriction"). Their presets field them unattached. Which squads should
they lead?

## 4. AI responsiveness (still open from before)

Task 85: the AI blocks the page while it thinks. Options were: yield to the browser between
units, move the AI into a Web Worker, or accept it. The rules-engine speed-ups so far cut AI
time by 40 percent with identical battles (1006 s -> 607 s over the 12 timed battles).
Remaining hot spots: `collectCombatEffects` (loops every registered combat effect) and the
weapon-profile copies in `Weapons._applyCombatProfile`. Continue there?

## 5. Questions from tonight's battle reports

(filled in as the reports are written)
