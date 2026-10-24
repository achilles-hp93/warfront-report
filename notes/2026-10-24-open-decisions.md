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
Hakon's Army, Heron's Army: 190-198 RP, the faction's EPIC HERO or senior CHARACTER as Marshal.
The names are placeholders ("<Marshal>'s Army"). They show up in the AI formation picker for
those factions.

The presets name no doctrine, but a preset with `doctrineId: null` is not fought without one:
the AI picks the faction's doctrine (`_pickAIDoctrineId`). So Rurik's Army fought with The
Bell's Muster, Finvarra's Army with Wild Hunt, Ramesses's Army with Rite of the Unending.
Should a preset be able to say "no doctrine", or is the AI's pick what you want?

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

## 5. Tonight's battle reports

Five new matchups, ten factions never played before. Each is a 6-battle batch (seeds 1000-1045,
four maps) and its closest battle replayed as the featured one. All five pages are private
claude.ai artifacts; the records are in `warfront-report/reports/<folder>/`.

| Report | Batch | Page |
|---|---|---|
| Genghis's Army (Baljuna Khaganate) vs Rurik's Army (Novgorod) | Khaganate 5-1, 32.2 to 20.0 VP | https://claude.ai/artifact/NXrh2W2mka4DH6CXmZdcDy |
| Finvarra's Army (Albion) vs Ramesses's Army (Duat) | Duat 6-0, 32.7 to 14.7 VP | https://claude.ai/artifact/RLynL31c6nu6aXkuKnkyfc |
| Merlin's Army (BLF) vs Herald's Army (Church of the Beast) | Church 5-1, 29.2 to 22.5 VP | https://claude.ai/artifact/16hHQ4PZKtzqhvuUjgW3tp |
| Saladin's Army (Caliphate) vs Taichou's Army (Nihon) | Nihon 4-2, 31.0 to 24.3 VP | https://claude.ai/artifact/3TVdATu56KW4YcqKztE7Hn |
| Hakon's Army (Runeforge) vs Heron's Army (Panhellenic League) | Runeforge 5-1, 29.2 to 20.3 VP | https://claude.ai/artifact/BaqM4RyoPmPY6qPS8AfA15 |

### AI problems the reports found (fix them?)

- **Forest of Fangs** (Church of the Beast, +1 melee AP for the round): cast 15 times, 45 Mana,
  nothing bought. The target made a melee attack that round in only 3 of 15 casts; 6 went on the
  Marrowstring Centaur, a shooter. The AI should value it only on a unit that will make a melee
  attack after the cast.
- **Blessing of Sacred Rabies** (10 Mana): 4 casts, nothing the record can price. It forces the
  enemy to attack an adjacent Church unit. Is its value the enemy's spent action plus SUPPRESSED?
  Not checked whether the forced attack spends the target's action.
- **Gatescrolls of Avalon** (Knight-Ascendants): in one battle the squad left the battlefield every
  round from 2 to 5, off the objectives each time.
- **Idle heavy melee**: the Oni Samurai (40 RP) idled 3.8 rounds a battle, the Taichou 4.3; the
  Rynda Guard (MOVE 2) 2.8, never acting in the featured battle.

### Units that scored little (cost, or the AI's use of them?)

- Hephaestian Tripod (20 RP) and Heliostat Battery (30 RP): 0 VP in six battles. Blinding Flash
  changed nothing in 8 uses.
- High King Finvarra (70 RP): 1.3 VP a battle, 1.9 per 100 RP, no objective VP ever hinged on him.
- Heron of Alexandria (55 RP): 1.1 VP a battle, 2.0 per 100 RP.
- Berserkir (30 RP): 0.7 VP a battle; Wild Hunt Riders (25 RP): 0.5.
- Rurik the Deathless (70 RP): 2.8 VP a battle, 4.0 per 100 RP.

### Gaps in the battle-report record

- **Fixed tonight** (`3d6d439c`): every choice prompt with a ":" in its id was recorded as a
  Miracle, so Matter Transmutation's stages and Kusanagi's square picks showed as Miracles that
  bought nothing. The Saladin vs Taichou report says so in its text; its numbers were recorded
  before the fix.
- **Not fixed**: the commands-and-abilities record does not see unit resources (Hunger, loot) or
  active-table entries, so Chant of the Kindling (14 casts), Hostile Takeover (7 uses) and the Fae
  Flow of Magic rolls (28) show as buying nothing without being measured. Add resources to its
  before/after?
- **Not fixed**: Matter Transmutation and Kusanagi no Tsurugi are not priced at all now (the
  coatings' effect on attacks; Kusanagi is recorded as an attack). Record them as one use each?
