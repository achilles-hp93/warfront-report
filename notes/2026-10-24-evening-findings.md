# Findings - 2026-10-24 (evening)

Answers to the user's questions of the afternoon. Nothing below is implemented unless it says so.
The probe scripts and their outputs are in `probes/2026-10-24-charges/`.

## 1. Charge, hold or shoot

Method: 8 battles (Host vs Court, Genghis vs Rurik, Saladin vs Taichou, Penitent vs Court,
Herald vs Merlin, two maps each). A probe in the page logged every Movement Phase decision with a
charge on offer: the charge's parts (`_aiScoreChargeSquare`), the walk it competed with
(`_aiChargeFloor`), and the best shot the unit had from its walk square (the AI's own expected
ranged damage x the target's worth). 108 charges were taken.

**Stay and shoot.** 20 of the 108 gave up a shot worth more than the charge. Most of them bought
objective ground worth 30 to 90 more than the walk: Veche Levy onto the Nerge Outriders (shot
5.6 HP, charge 3.3), Cultist Troopers onto the Adur Furnace Guard. A few bought nothing:
Covenant Levies 2 and 3 charged Cultist Troopers 2 onto squares worth less than staying, giving
up a 5.6 HP shot for 4.2 HP of melee, with 5 HP coming back. Cultist Troopers took a 1-in-2
charge onto Covenant Levies 1 instead of a shot worth almost three times as much.

Cause: the charge scorer counts the shot it gives up (`forgo`) as half the ranged damage on the
charge target only, only for a unit whose shot beats its melee, and not at all when the landing
square is near an objective. The walk's own shot enters the comparison only through the
log-compressed offensive term of the destination score.

Proposal: `forgo` = the best shot the unit would take this round from its walk square, at any
target, in the same HP units as the melee, at full weight. A failed charge leaves the unit where
it stands with its APt (`completeChargeInPlace`), so it can still shoot from there: the charge's
value is P x (landing + fight) + (1 - P) x (staying + the shot from here). Drop the objective
waiver: the landing square's objective term already carries the objective.

**Losing fights for ground.** 22 of the 108 charges went into fights the charger loses badly
(it deals less than half what it takes): Muqatila Troopers into the Oni Samurai (0.3 against 12),
Wildling Acolytes into a Knight-Banneret (1.3 against 19), the Queen Consort into the Sagdid
Hound-Keepers (1.6 against 12). Each one bought a landing square worth 5 to 49 more than the
walk. Of the 8 in the second set with a next round to look at, 3 chargers were dead by then.

Cause: the landing square's objective survival (`_aiEnemyDamageReaching`,
`objective_survival.js`) shares each enemy's attack among every unit of ours it can reach this
round. An enemy beside the charger is locked in melee with it, so it cannot spend that attack on
anyone else.

Proposal: an enemy in contact shares its attack only with our units beside it.

**Heavy holds while chaff charges.** This is rare: 4 rounds in 4 battles where a unit with at
least 1.5 times the melee held back while a weaker friend charged (15 in the 54-game study).

- The Assault Lycanthropes held rather than fight a Knight-Banneret they would lose to (3.3 dealt,
  16.5 taken). That was right.
- The Babylonian Assassin held an objective and turned down a 9.8 HP fight by 8.7, through the
  2.5 abandon margin and a walk worth 17 more. That is arguable.

No change is proposed. If wanted: move heavy melee first, so it picks its charge before the chaff.

**Heavy melee stops short.** In Round 2 the Oni Samurai turned down a sure charge worth 12 HP
(0.3 coming back) and walked to a square worth 16 more on position. Then it did nothing for the
round. The charge score counts melee in raw HP (12) while the destination terms run 20 to 400.
A sure good fight is undervalued against a positional step. The Action Phase prices the same
attack at 12 x 6.1 = 73.

Proposal: price the charge's fight as the Action Phase prices attacks, expected HP x the
target's worth, with one weight. Set the weight with a batch so that a sure good fight beats a
step and a big objective gain still wins. This is the largest change of the set.

**A charge the target walks away from.** From the 54-game study: 150 charges were answered by a
Fall Back. 101 of those failed the test (1.76 HP of disorder damage on average), and 56 left an
Objective Area. A charge on a unit that can still move is therefore worth something even when it
leaves.

Proposal: price that charge as stays x the fight + leaves x (its expected disorder damage + the
objective control it gives up), with the leave chance taken from the enemy's own Fall Back
weighing (`_aiEvalFallBack`).

**Shooting overall.** Over the 54 games:

- Attacks: 884 ranged against 514 melee.
- Damage: 1767 ranged against 2045 melee.

Types that shoot better than they fight but charge anyway:

| Type | Charges | HP per shot | HP per fight |
|---|---|---|---|
| Cultist Troopers | 26 | 2.5 | 1.4 |
| Veche Levy | 11 | 2.4 | 1.4 |
| Chiron Battle Tank | 5 | 1.9 | 1.0 |
| Ramesses | 5 | - | no melee damage at all |

## 2. Triple Hills

Every objective square, (1,7), (7,7) and (13,7), sits in the middle of a 3x3 forested hill. The
forest gives CONCEALMENT and LIGHT COVER, and blocks Line of Sight unless one end is higher. All
four skirmish maps share those objective squares; only Triple Hills puts woods on all three.

Within the same matchup, the melee share of damage is higher on Triple Hills in 28 of 34
batches. Overall it is 60 percent melee, against 40 to 52 percent on the other maps, and a
ranged attack deals 1.80 HP there against 2.04 to 2.48. Cohort vs Procession, for example,
deals 50 to 69 ranged damage a game elsewhere and 29 to 39 on Triple Hills.

The shooting army still won 17 of 27 battles there, against 40 of 91 on the other maps. The map
changes how damage is dealt, not who wins. The sample is 11 batches with a clear shooting army,
5 of them Cohort vs Procession.

Options:
- (a) Keep it as it is. The map has an identity and does not decide winners.
- (b) Forest on the crest only, with open hill around it.
- (c) The ring gives LIGHT COVER but does not block Line of Sight.

## 3. Empire of Nihon prefers Kusanagi

In 6 battles the Regalia were used 10 times for Kusanagi, 4 for Kagami and 0 for Magatama.
Kusanagi was used in Round 1 of every battle.

Cause: the three share one pool and are offered in phase order:

- Kagami at the Command Phase start;
- Kusanagi at the Movement Phase start;
- Magatama at the Action Phase start.

The AI spends at the first one that clears its own `ai_min_value`, so Magatama, offered last,
never gets the pool. Magatama is also priced by a flat dice count. Its +2 AR and +2 FR count as
4 dice, though a weapon uses only one of the two.

Natural fix:
- (a) When spends share a pool, spend at a point only if this one is worth at least the best of
  the others still to come this round (estimated now, in the same currency).
- (b) Price Magatama by what it does: the expected damage its unit's best attack gains, x the
  target's worth, x the chance that unit attacks this round (`aiUnitAttackChance`).

The pool then goes where it is worth most, with no bias written in.

## 4. Hover and aerial combat

The AI never changes altitude: no AI code calls CHANGE ALTITUDE. A HOVER unit starts in ground
mode and stays there all battle, with MOVE 3, OC 1 or 2, and no FLYING. There were 0 altitude
changes in 289 recorded battles. Only `valkyrie_army` fields HOVER units (Shieldmaidens, the
Valkyrie), and it is in tonight's batch against the Taichou.

Air mode would give MOVE 5, PER 5, OC 0, FLYING (-1 to be hit without ANTI-AIR, no cover), and a
charge onto a ground unit that ignores Zones of Control and lands.

Proposal: CHANGE ALTITUDE as an Action Phase candidate, priced as next round's best destination
in the other mode minus the best attack the APt could make now. The expected pattern:

- ascend when there is no attack this round and the goal is far or screened;
- come down by charging;
- descend to hold an objective (OC 0 in the air).

## 5. Double Time

Fixed earlier today (`cb0bb9ff`): Double Time is worth the walk and the charge it adds over the
unit's own plan, and is used only when that is at least 1.0. Tonight's five batches are the
first battles played with it.

## 6. Rules queries: speed

The research is in `research/rules-query-architecture.md`.

Recommended first steps:

- **0. Verify mode.** On every memo hit, recompute and compare, then throw on any difference.
  Add a memo-off switch.
- **1. Memoise `Weapons.profile` and `Weapons.groups` within a reading.** The profile is the
  largest cost in the profile run.
- **2. Zero-copy modifier reads.**
- **3. Drop `_cloneCombatUnit`.** The clone is what keeps the existing aura, Stats and tag memos
  from hitting.

Each step is proved by an identical replay of fixed AI-vs-AI seeds with verify mode on.
