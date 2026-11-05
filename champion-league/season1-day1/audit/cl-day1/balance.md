# Champion League Day 1: balance analysis

Evidence: 24 AI-vs-AI battles (`cl-s1-d1-d1-m01` to `m24`), 48 preset armies of about 250 RP each, CROSSROADS, no doctrine. That is 457 non-HQ unit copies of 242 unit types, 1,222 VP and 2,722 HP of damage. 45 of the copies arrived during the battle through Troop Requisitions.

Method: every number is read through the repo's own modules. `summarize.cjs` is called after `page/enrich.cjs` (the same order `digest.cjs` uses), which brings in `attribution.cjs` (Shapley VP, "hinged" objective VP) and `activity.cjs` (idle rounds, actions). The analysis scripts and the collected data are in `/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-day1/analysis/` (`collect.cjs` writes `data.json`; `analyze.cjs`, `appendix.cjs`, `ocstudy.cjs`, `kinds.cjs`, `vsdef.cjs` and the rest read it). Nothing in the repo was edited.

**How sure to be.** Day 1 is one battle per army, and most unit types appear 1-4 times. The tags below mean:
- **High**: 20 or more copies, or Day 1 agrees with an older batch of the same preset.
- **Moderate**: 6-19 copies, or a group of units.
- **Low**: 2-5 copies.
- **Anecdote**: 1 copy.

One copy's VP surplus has a standard error of about ±2.4 VP. So every per-type ranking below is also shrunk toward par with an empirical-Bayes estimate: the within-type SD is 2.42 VP, the between-type SD is 1.56 VP, so a single copy keeps 29% of its surplus and six copies keep 71%.

**Caveats on the measures**
- Shapley VP credits **holding** ground, not **killing**. A unit that destroys the enemy's scorers gets nothing for the VP the enemy then fails to score. So there is a second lens, **value = VP + kill denial**. Each kill is credited with the victim's RP × 2.20 VP per 100 RP per Battle Round × the rounds left (the league rate, counting the round of the kill). Denial adds 146 VP to the 1,130 VP credited to units.
- A CHARACTER's CP income and auras are not in VP.
- Requisitioned units are counted at their RP, although they are paid for with CP.
- Damage is the HP actually lost, from the combat records. Damage a defender deals back in melee is credited to the defender. A joined pair's damage is credited to whichever of the two the record names.
- OC is the template's ground OC. Six flyers are `x/0`: they have 0 OC while airborne.
- The same AI plays both seats, so a unit the AI uses badly looks weak.

Older batches: the scratchpad has no `wf-out*` folders. I used older builds' batches of the same presets only to corroborate a result, and I name each one where it is used. They are older engine builds, so they show direction, not exact values:
- `d52n-out/palatine-vs-convent` (6 games)
- `d67-out/longwu-vs-krakow` (6 games)
- `d48-out/bailiffs-vs-etna` (6 games)
- `d42-out/lightbearers-vs-protectores` (6 games)
- `d38-out/herald-vs-legion` (6 games)

None of them contains the Golgothic Paladins.

## Headlines

1. **The score is about position, and position comes from OC that stays alive.**
   - Objective VP is 56% of all VP (680 of 1,222). The Primary cards actually scored were 78% positional (221 of 282 VP), and most completed secondaries were positional too. Overall, about 80% of the score came from standing somewhere.
   - The side with more unit-rounds in Objective Areas won 21 of 23 battles (one tie). The side that lost less RP won 20 of 24.
   - The side with more OC at deployment won only 13 of 24. But armies under 25 OC went 1-4.
2. **OC is not priced into RP.**
   - A regression of template RP on OC, HP and weapons gives **−0.9 RP per OC point**: high-OC units are cheaper. Meanwhile VP rises steeply with OC per RP. Units under 10 OC/100RP score 6.3 VP/100RP; units over 35 OC/100RP score 15.7.
   - STANDARD squads score 15.1 VP/100RP, ELITE squads 9.7, SPECIALIST 5.1, and EPIC HERO characters 4.7. All 27 EPIC HERO characters fielded scored below par.
3. **Melee decides the fighting; ranged does not.**
   - Melee did 49% of the damage, plus 6% from Falls Back in disorder. It struck 64% of the killing blows and destroyed 67% of the RP lost.
   - Winners out-dealt losers 947 to 540 in melee, but only 537 to 517 at range.
   - Shooter squads still score at par per RP (11.4 VP/100RP, against 11.6 for melee squads), because they are the cheap OC bodies. The ranged losers are the dedicated guns (2.8 VP/100RP) and fire against armour: 57-86% of shots at DEF 2+/3+ targets did no damage.
4. **The Golgothic Paladins are the best combat piece per RP in the league, but they do not score on their own.**
   - In 2 battles they averaged 24.5 damage and 76 RP killed per battle, losing 2 of 30 HP in total, and their armies went 2-0.
   - They earned only 4.0 VP/100RP of Shapley VP, and are about par once kill denial is counted. Not proven too strong. Low confidence; a batch is needed.
5. **Army builds.**
   - Four armies with 10-18 models and 11-23 OC went 0-4. Two of them lost without losing a single unit.
   - Five armies banked 14-29 Mana with no caster to spend it. Only 25% of all Mana gained was spent.

---

## 1. Unit types

Par is **9.07 VP per 100 RP** (Shapley VP), or 10.23 per 100 RP for value (VP + kill denial). "Excess" is VP per copy per battle minus par for its RP. "RP-eq" is the shrunk excess turned into RP: how many RP the unit was worth above (+) or below (−) its price on Day 1. The full table of all 242 types is the appendix.

### Robust results (3 or more copies, by RP-equivalent on VP)

| unit | copies (arrived) / battles | RP | OC | VP/copy | VP/100RP | RP-eq VP | RP-eq value | dmg/copy | surv | in-army idx | W | conf. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Corporaider Squad | 6 / 2 | 22 | 10 | 5.1 | 23.2 | +25 | +22 | 8.2 | 83% | 1.78 | 6/6 | low-moderate (2 armies, both won) |
| Parish Militia | 6 (1) / 2 | 13 | 10 | 4.2 | 32.1 | +24 | +22 | 0.8 | 83% | 2.69 | 6/6 | low-moderate (2 armies, both won) |
| Commandery Bannermen | 8 (2) / 1 | 10 | 5 | 3.1 | 30.7 | +18 | +17 | 1.9 | 75% | 2.43 | 8/8 | low on Day 1 (one army), **high with the older d67 batch** (42 copies over 6 games, 27.9 VP/100RP) |
| Covenant Levies | 37 (10) / 8 | 10 | 10 | 2.2 | 22.4 (25.4 deployed) | +14 | +12 | 2.1 | 81% | 2.34 | 25/37 | high (d52n: 34 copies, 27.6) |
| Sidhe Wardens | 9 (1) / 3 | 18 | 10 | 3.2 | 17.8 | +14 | +18 | 7.7 | 44% | 1.27 | 7/9 | moderate |
| Ironthunder Vanguard | 4 / 2 | 36 | 6 | 5.1 | 14.0 | +12 | +23 | 20.3 | 100% | 1.40 | 4/4 | low (d38: 12 copies, 12.7) |
| Muqatila Troopers | 10 (2) / 3 | 13 | 10 | 2.3 | 17.4 | +10 | +8 | 4.1 | 50% | 1.84 | 5/10 | moderate |
| Javidan Immortals | 4 / 2 | 30 | 10 | 3.9 | 13.0 | +8 | +10 | 9.0 | 100% | 1.11 | 4/4 | low |
| Knight-Apostle Squad | 3 / 3 | 35 | 6 | 4.4 | 12.5 | +7 | +16 | 15.7 | 67% | 1.39 | 2/3 | low (d52n: 6 copies, 12.9) |
| Cultist Troopers | 25 (13) / 7 | 10 | 10 | 1.6 | 15.6 | +7 | +6 | 1.9 | 60% | 1.69 | 9/25 | high (d48: 28 copies, 28.6) |
| Tamga-Bound Troops | 5 (2) / 1 | 10 | 10 | 0.7 | 6.5 | −2 | −2 | 3.0 | 80% | 0.49 | 5/5 | anecdote (one army) |
| Etxe Riflemen | 4 (1) / 1 | 15 | 10 | 0.6 | 4.2 | −5 | −6 | 9.5 | 75% | 0.59 | 0/4 | anecdote (one army) |
| Pahak Riflemen | 5 (2) / 1 | 16 | 10 | 0.6 | 3.7 | −6 | −6 | 1.6 | 40% | 0.58 | 0/5 | anecdote (one army) |
| Legionnaire Squad | 11 (4) / 6 | 20 | 10 | 1.0 | 5.2 (4.0 deployed) | −7 | −8 | 3.7 | 36% (14% deployed) | 0.56 | 5/11 | moderate (d38: 12.0; d48: 3.6) |
| Rapacious Crusader | 3 / 1 | 30 | 6 | 1.5 | 5.0 | −7 | −5 | 5.3 | 0% | 0.96 | 0/3 | anecdote (one army; d48: 18 copies, 10.5) |
| St. Barbara Field Gun | 5 / 3 | 26 | 1 | 0.1 | 0.3 | −17 | −18 | 2.4 | 60% | 0.05 | 0/5 | moderate |

Several of these types come from a single army. Copies in one battle share the same opponent and the same dice, so a type's number of battles matters more than its number of copies.

"In-army idx" is the unit's share of its own army's VP divided by its share of its army's RP. It cancels out how strong the army was: 1.0 means the unit scored exactly its share. The riflemen and Legionnaires at the bottom score about half their share even inside their own armies, so their numbers are not only the result of being in losing armies.

### Group results (moderate to high confidence)

| group | copies | VP/100RP | dmg/100RP | surv | notes |
|---|---|---|---|---|---|
| EPIC HERO characters (avg 71 RP) | 27 | **4.70** | 7.7 | 26/27 | all 27 below par; best: Finvarra 6.2, Caesar 6.2, Genghis 6.0 VP |
| other characters | 86 | 8.01 | - | - | near par |
| joined pairs (character + squad combined) | 88 | 7.74 | 16.5 | - | ELITE squads with a leader 10.9 VP/100RP vs 8.5 without, so leaders help, but not by their cost |
| dedicated guns and ranged vehicles | 18 | **2.76** | 25.4 | 83% | 0.39 rounds in an Objective Area per copy |
| ELITE/EPIC squads, OC ≤1 per model | 27 | 8.12 | 28.6 | 74% | TOUGH ones: 9 copies, **5.54** |
| ELITE/EPIC squads, OC ≥2 per model | 47 | 11.33 | 29.4 | 68% | TOUGH ones: 19 copies, 11.64 |
| STANDARD squads | 193 | 15.13 | 24.5 | 63% | 62 OC per 100 RP |

### Over-performers for their cost

1. **Cheap OC squads: Commandery Bannermen, Parish Militia, Covenant Levies, Corporaider Squad.** They score 22-32 VP/100RP against a par of 9.1, worth +14 to +25 RP each. Confidence:
   - **Covenant Levies: high.** 8 battles on Day 1, and the d52n batch agrees (27.6 VP/100RP over 34 copies).
   - **Commandery Bannermen: high,** but only because the d67 batch agrees (27.9 over 42 copies). On Day 1 they come from one army.
   - **Parish Militia and Corporaider Squad: low to moderate.** 2 armies each, all of them winners.
2. **Sidhe Wardens** (+14 VP, +18 value). They have 10 OC, deal 43 damage per 100 RP and survive only 44%. Moderate.
3. **Ironthunder Vanguard, Javidan Immortals and Knight-Apostle Squad** (+7 to +12 VP, +10 to +23 value). These are ELITE squads with 2 OC per model and real damage. Low confidence.
4. **Single-copy standouts** (anecdote; do not act on one battle):
   - Wild Hunt Riders: 25 RP, 11.2 VP, +29 RP-eq.
   - Peijaiset Wardens: 40 RP, 12.4 VP, +28.
   - Black Huskarls: 32 RP, 10.7 VP, +25.
   - Assault Lycanthropes: 30 RP, 107 damage per 100 RP.
   - Michaelite Brethren: 2 copies, 166 RP killed per 100 RP, +29 on the value lens.
   - Babylonian Assassin: 2 copies, +31 value.
   - Basajaun Smith: 45 RP, 10 objective VP; idle all 6 rounds, 5 of them in an Objective Area.

### Under-performers for their cost

1. **EPIC HERO characters as a tier** (27 copies in 24 battles, 4.7 VP/100RP; on the appendix numbers mostly −5 to −22 RP each). The worst:
   - Ramesses: 75 RP, 0 VP.
   - Palatine Custos (Mounted), a squad rather than a character: 80 RP, 0.3 VP, 0 damage, destroyed.
   - Caesar (Mounted): 85 RP, 1.8 VP.
   - Tomas Zumalakarregi: 65 RP, 0.5 VP.
   - The Dawn King: 70 RP, 0.8 VP.
   - Saladin (Mounted), Ivan Sirko (Mounted), Otto of Saxony, Gilgamesh, The High Admiral, The Chairman, Rurik and Ardashir: 1.3-3.0 VP each for 70-85 RP.

   Moderate to high confidence for the tier, low for any one hero. Part of their value (CP, auras) is not counted, but "other characters" score near par under the same measure.
2. **St. Barbara Field Gun** (5 copies, 0.1 VP per copy, never in an Objective Area, −17 RP). Moderate.
3. **Dedicated guns in general**:
   - Vermillion Rocket Battery: 2 copies, 0 VP although it did 55 damage per 100 RP; 2.0 VP/100RP over 12 copies in the older d67 batch.
   - Morphean Engine: 2 copies, 0 VP.
   - Tsuchigumo Gun Battery: 0 VP.
   - Nicomedean Thunder Tower: 0.3 VP.
   - Carpet-Bomber: 2 copies, 0.3 VP.
   - Earthshaker Mortar and T.A.L.O.S: 1.1 VP/100RP each in older batches.

   Moderate as a group.
4. **Palatine Custos** (65 base, fielded at 70 with gear; 2 copies; 0 damage between them; 6.7 VP/100RP; −8 VP, −12 value). Also 2.4 VP/100RP over 6 copies in d52n and 8.4 in d42. The Palatine Artillerists show the same pattern, less clearly. Moderate.
5. **Legionnaire Squad** (11 copies, 5.2 VP/100RP; the 7 deployed copies scored 4.0 and survived 14%). Moderate.
6. **Consecrated Hussars** (43 RP with gear, 3.7 VP/100RP, −11 value; 4.5 VP/100RP over 12 copies in the older d67 batch). Moderate.
7. **Praetorian Fireteam** (2 copies, 0 VP, both destroyed); **Knight-Scourgers, Bogatyr Thunderguards, Leshen Besieger, Bounded Ifrit, Comitatus Armored Carrier** (1 copy each, 0 VP). Anecdote.

### Idle rounds

- There were 782 idle unit-rounds: a unit with APt to spend that spent none.
- In 90% of them (706) the AI had no legal action; this is not the AI passing up an action.
- 42% of them (332) were spent standing in an Objective Area, holding it.
- Idle rounds per copy, by role:

| role | idle rounds per copy |
|---|---|
| beasts and melee vehicles | 2.5 |
| characters | 2.0 |
| melee squads | 1.75 |
| shooter squads | 1.4 |
| guns | 1.4 |

- Idle units that also scored little: Staurotheke War-Shrine (4.5 idle per copy, 3.2 VP/100RP), Palatine Custos (4.0, no damage), Leshen Besieger (4, 0 VP), Gilgamesh (4), Tomas Zumalakarregi (4), Sniper Hesychast (3.5, 0 VP), Seraphic Justiciar (3.0, 1.4 VP/100RP) and Carpet-Bomber (3.0).

---

## 2. OC in pricing

### How much OC and bodies drove the VP

- **VP by source:** objectives 680 (56%), Primary 282 (23%), secondaries 260 (21%).
  - Primary cards, by VP scored: BREAK THEIR HOLD 91, IMPENETRABLE FORTRESS 59 (bodies outside the deployment zone), LEAD FROM THE FRONT 48, FORLORN HOPE 14. Positional cards scored 221; kill or suppress cards scored 61.
  - Secondaries completed most often: DEEP REACH 17/23, IRON GRIP (7 OC on one objective) 12/15, TAKE UP THE GAUNTLET 10/17, SECURE THE FLANKS 9/14, STRONGPOINT 8/8. The kill cards rarely completed: ASSASSINATION 3/12, FOCUSED FIRE 3/14, MAN OF THE HOUR 1/7.
- **Side level** (48 sides). "Side with more won" is wins-losses for the side with more of the measure.

| measure | r with objective VP | side with more won | winners' mean | losers' mean |
|---|---|---|---|---|
| unit-rounds in an Objective Area | 0.73 | **21-2** | 21.5 | 12.3 |
| OC on the board per round (surviving models, SUPPRESSED counted as 0) | 0.40 | **18-6** | 39.4 | 25.8 |
| RP lost | −0.34 | lost less: **20-4** | 36 | 83 |
| damage dealt | 0.47 | 17-6 | 66 | 48 |
| models at deployment | 0.23 | 15-9 | 39 | 33 |
| units at deployment | 0.18 | 14-6 | 9.0 | 8.2 |
| OC at deployment | 0.29 | 13-11 | 49 | 41 |

- **There is a floor, not a slope.**
  - OC at deployment: under 25, 1-4 (6.6 objective VP per battle); 25-40, 4-6 (14.1); 40-50, 8-6 (15.0); 50 and over, 11-8 (15.6).
  - Squads: armies with 4 or fewer non-CHARACTER units went 1-5.
  - Armies with 0-2 units of OC 5 or more went 1-6.
  - Above about 40 OC, more OC buys almost nothing.
- **Unit level:**
  - VP/100RP by OC per 100 RP: under 10, 6.26 (165 copies); 10-20, 9.72; 20-35, 11.11; over 35, 15.72.
  - Objective VP per round a unit stands in an Objective Area, by the unit's OC: 0-1 OC, 0.39; 2-4 OC, 0.74; 5-8 OC, 0.98; 9 or more, 1.08. **A unit's OC is worth having up to about 5**; beyond that it saturates.
- **Price check.** A regression of template RP over 241 types (R² 0.24) gives OC **−0.86 RP per point**, HP +0.67, melee attacks×DMG +1.0, ranged +0.18, CHARACTER +17.5. A regression of VP per copy gives **+0.08 to +0.11 VP per OC point per battle**, worth about 0.9-1.2 RP per OC at par. A 10-OC squad therefore earns about 9-12 RP of its value from OC alone, which is all of a 10-RP Levy's price.

### Elites and the user's caveat

The data supports both halves of the user's view:
- **Elites that hit or survive hard do fine with 2 OC per model.** Knight-Apostle Squad (12.5 VP/100RP), Crimson Knights (11.5), Ironthunder Vanguard (14.0), Javidan Immortals (13.0) and Khesig Guards (15.1). The TOUGH ELITE squads with 2 OC per model average 11.6 VP/100RP and kill 71 RP per 100 RP.
- **Extreme killers can win even with no OC.** Murderhost of Halfa won 30-27 with 15 OC (Furyforged Berserkers and Cultist Zealots have 0) by destroying 162 RP.
- **What fails is elite squads at 1 OC per model and EPIC prices**, and the 65-85 RP EPIC HERO characters:
  - Palatine Custos and Artillerists, Consecrated Hussars, Khassakiyya Guard and Palatine Custos (Mounted). The TOUGH ones with OC ≤1 per model average 5.5 VP/100RP over 9 copies.
  - An army built from them cannot cover three Objective Areas. Protectores Divini Lateris (4 units, 10 models, 11 OC) lost 20-32 without losing anything; Blaze of Etna won the fight 44-25, lost nothing, and lost 12-36; Celeritas Squadron scored 0 objective VP in every round.

### Proposals, unit by unit (worst cases first)

| unit | now | proposal | evidence | confidence |
|---|---|---|---|---|
| Palatine Custos | 65 RP (70 with gear), 3 models × OC 1 | **OC 2 per model (3 → 6) and 65 → 55 RP** | 2 copies, 0 damage, 6.7 VP/100RP; 2.4 VP/100RP in d52n (6 copies) and 8.4 in d42 (6) | moderate |
| Palatine Custos (Mounted) | 75 RP (80), OC 3 | **OC 2 per model, 75 → 65 RP** | 1 copy: 0.3 VP, 0 damage, destroyed | anecdote, same unit family as above |
| Palatine Artillerists | 65 RP, OC 3 | **OC 2 per model**, keep RP | 1 copy 7.7 VP/100RP; 3.6 (d52n) and 9.2 (d42) | low |
| Consecrated Hussars | 40 RP (43-46 with gear), OC 3 | **OC 2 per model (3 → 6)** | 2 copies 3.7 VP/100RP; 4.5 over 12 copies in the older d67 batch | moderate |
| Khassakiyya Guard | 45 RP, OC 3 | OC 2 per model | 2 copies 6.1 VP/100RP | low |
| EPIC HERO characters | 65-85 RP, OC 3-5 | **−10 RP each** (or +2 OC: a hero spends 3.1 rounds per battle in an Objective Area, the most of any tier) | 27 copies, 4.7 VP/100RP, all below par | moderate to high for the tier |
| Covenant Levies | 10 RP, OC 10 | **10 → 12 RP** | 37 copies, 22.4 VP/100RP (25.4 deployed); 27.6 over 34 copies in d52n | high |
| Commandery Bannermen | 10 RP, OC 5 | **10 → 12 RP** | 8 copies in one army, 30.7; 27.9 over 42 copies in d67 | high (with d67) |
| Parish Militia | 13 RP, OC 10 | **13 → 15 RP** | 6 copies in 2 armies, 32.1, 6/6 W | low to moderate |
| Corporaider Squad | 22 RP, OC 10 | **22 → 25 RP** | 6 copies in 2 armies, 23.2, 6/6 W | low to moderate |
| Cultist Troopers | 10 RP, OC 10 | hold | 25 copies, 15.6 VP/100RP on Day 1 (higher, 28.6, in d48); its faction went 3-4 | - |
| Golgothic Paladins, Knight-Apostles, Crimson Knights, Michaelite Brethren | OC 2 per model or 2/0 | **no OC change** (lethality and durability already pay for them) | see section 3 | low |

**Rule alternatives**, if a rule is preferred to editing each unit:
- **"Elite bearing":** a non-CHARACTER ELITE or EPIC model counts at least OC 2. This touches the 19 ELITE/EPIC squad types now at 1 OC per model. It would also lift single-copy over-performers like Black Huskarls and Assault Lycanthropes, so the unit-by-unit edit is more precise.
- **An OC price in the cost formula:** about +1 RP per 3-4 OC for STANDARD squads at ≥0.75 OC per RP.

Both halves together (cheap OC up about 20%, low-OC elites and heroes down 10-15%) narrow the gap without making hordes unplayable. Raising the cheap squads alone would move about 8 RP out of a typical Covenant list (four Levies at +2 RP each).

---

## 3. Golgothic Paladins

Data: 60 RP; 3 models with 5 HP each, DEF 2+, TOUGH (reroll failed saves against DMG ≤2), OC 2 per model. Each carries a Cross-Maul (AR 2, DMG 5, AP 1). Abilities:
- **Sacred Stigmata:** adjacent friendly units cannot be targeted by enemy attacks or abilities.
- **Cross Bearers of Bethlehem:** +1 AR and +1 DMG below half strength. It never triggered.

They appear in 2 of the 24 battles, M06 and M24, fielded without gear.

| | M06: Martyrs' Legion 35-16 Oath of Kraków | M24: Miserere Column 31-28 Scorpion Shields |
|---|---|---|
| damage dealt (HP) | 18. Commonwealth Fusiliers 2 charged them and were wiped out by the counterattack (10); Consecrated Hussars 2 lost 8 the same way | 31. Destroyed Praetorian Fireteam (R2), Gunners 2 (R4), Gunners 1 and Tribune 2 (R5) |
| RP destroyed (killing blows) | 12 | **140** |
| damage taken | 0 from 4 attacks | 2 of 15 HP |
| rounds in the centre Objective Area | 3 of 4 | 5 of 6 |
| Shapley VP (hinged) | 2.0 (3) | 2.8 (0) |
| kill denial | 0.8 | 9.2 |
| shield effect | 4 enemy counterattacks refused ("target is protected"): 3 against the Archistrategos and 1 against the Knight-Apostle Squad, all of them adjacent to the Paladins | none logged |
| army RP lost (own / enemy) | 20 / 141 | 66 / 195 |

How they compare:
- **Combat.** 24.5 damage and 76 RP killed per battle (127 per 100 RP), and 2 HP lost over both battles. Among types with 2 or more copies, only the Michaelite Brethren (166 per 100 RP, also Covenant) and the 10-RP Cultist Zealots kill more per RP. Against the Knight-Apostle Squad (35 RP, 3 copies: 102 per 100 RP, 33% of HP lost, 67% survival), the Paladins kill more per RP and take a fifth of the damage.
- **Ranged fire cannot answer them.** Ranged attacks into DEF 2+ TOUGH targets averaged 0.14 HP and missed entirely 86% of the time. Overwatch did 0 in 11 shots.
- **Scoring.** 2.4 VP per copy, 4.0 VP/100RP: −15 RP-eq on the VP lens. They share the centre with three or four other units, and their 6 OC is a small part of it.
- **Value lens (VP + denial).** 7.4 per copy, 12.3 per 100 RP against a par of 10.2: about +6 RP-eq, which is about par.

**Verdict.** On these two battles the Paladins are **strong, not proven too strong for 60 RP**: their combat is the best per RP in the league, but their score is par or below.
- Their power reaches the score through their teammates: the Archistrategos and Knight-Apostles that Sacred Stigmata protects, and the enemy units they delete.
- The two parts that are out of line:
  - **Sacred Stigmata blocks counterattacks against protected allies.** An adjacent hero can strike without being struck back, which the ability's text allows but may not be intended.
  - **TOUGH on a 2+ save** means a hit from a small arm has a 1/36 chance to get through.
- I would not move their RP or OC on Day 1 alone. If a change is wanted, the candidates, mildest first:
  1. Sacred Stigmata does not stop melee counterattacks.
  2. 60 → 70 RP.
  3. Drop TOUGH.

Confidence: **low** (n = 2, two opponents, both elite-infantry or cavalry armies that walked into them). The batch to play is at the end.

---

## 4. Ranged vs melee

### Who does the damage

| kind | damage | share | killing blows | RP destroyed | per attack |
|---|---|---|---|---|---|
| ranged (Action Phase) | 874 | 32% | 29 (22%) | 546 (19%) | 2.38 per attack |
| Overwatch | 180 | 7% | 4 (3%) | 84 (3%) | 1.05 per shot (171 shots; hits only on a natural 6) |
| melee (strikes and counterattacks) | 1,323 | 49% | 85 (64%) | 1,901 (67%) | 3.63 per melee action |
| Falls Back in disorder (a consequence of melee) | 164 | 6% | - | part of 298 | - |
| Burning | 97 | 4% | - | part of 298 | - |
| magic and abilities | 46 | 2% | 1 | 25 | about 1 per cast |

- **By round.**
  - Round 1: ranged 137, melee 18.
  - Round 2: ranged 243 + 134 Overwatch, melee 501 + 48 from Fall Back.
  - Rounds 3-4: ranged 419, melee 597 + 90.
  - Rounds 5-6: ranged 75, melee 207.
- **Winners against losers.** Ranged plus Overwatch: 537 against 517. Melee plus Fall Back: **947 against 540**. Ranged damage does not separate winners from losers; melee does.
- **Against armour.**

| target DEF | ranged: per attack | ranged: no damage | Overwatch: per shot | melee: per record |
|---|---|---|---|---|
| 2+ TOUGH | 0.14 | 86% | 0 (11 shots) | 1.80 |
| 2+ | 0.71 | 57% | - | - |
| 3+ TOUGH | 1.06 | 72% | - | 2.67 |
| 3+ | 1.36 | 58% | - | 2.78 |
| 4+ | 2.48 | - | - | 4.10 |
| 5+ | 2.87 | 21% | - | 5.28 |
| 6+ | 3.49 | 22% | - | 6.20 |

  82% of fielded ranged model-weapons are AP 0 (melee: 72%).
- **Moving.** 74% of ranged attacks were made after moving that round: 2.05 HP per attack, against 3.44 for the attacks made standing still.
- **Who takes the damage.** Shooter squads lose 49.3 HP per 100 RP, melee squads 25.4. SUPPRESSED (OC 0), the one way damage takes ground away, was on only 38 of 1,744 unit round-ends (2%).

### Who scores

| role (from template weapons) | copies | RP share | VP share | VP/100RP | objective VP/100RP | damage share | rounds in an Objective Area per copy |
|---|---|---|---|---|---|---|---|
| melee squads | 138 | 30% | 38% | 11.56 | 6.94 | 47% | 1.97 |
| shooter squads | 164 | 22% | 27% | 11.41 | 7.61 | 24% | 1.29 |
| beasts and melee vehicles | 24 | 7% | 6% | 7.91 | 4.87 | 5% | 1.75 |
| characters | 113 | 36% | 26% | 6.60 | 3.52 | 18% | 2.44 |
| guns and ranged vehicles | 18 | 5% | 1% | **2.76** | 1.53 | 6% | **0.39** |

- Splitting each unit's VP by its own damage mix: ranged 34%, melee 40%, magic and abilities 1%, and units that dealt no damage 24%.
- Units whose damage was mostly ranged scored 10.3 VP/100RP; mostly melee, 9.9.
- The most ranged-heavy armies (two thirds or more of their squad RP in shooter squads) went 3-6, mixed armies 10-6, and melee-heavy armies 11-12. That is only 9 armies in the ranged-heavy group: low confidence.

### My view

The user is right about damage and right that melee carries board presence:
- Melee kills twice what ranged does per action.
- Melee takes three quarters of the RP destroyed (with Fall Back).
- An engaged unit cannot be shot unless every friendly unit beside it is EXPENDABLE, so melee also shields itself from fire.
- Melee is what separates winners from losers.

But **"ranged needs a buff" is too broad.** Cheap shooter squads already score at par, because they are the OC bodies. Ranged already does 2.9-3.5 HP per attack against DEF 5-6+ chaff. A blanket ranged buff would mostly help hordes shoot hordes.

The real gaps are:
1. Fire against armour (DEF ≤3+, and TOUGH).
2. Overwatch, which hits only on 6s.
3. The immunity that being engaged gives.
4. The price of the dedicated guns, which score 2.8 VP/100RP and stand in an Objective Area 0.4 rounds per battle.

### Options and what each would change

1. **Overwatch hits on 5+ instead of a natural 6.** This about doubles Overwatch damage: +about 180 HP on Day 1's numbers, taking ranged plus Overwatch from 39% to about 43% of all damage. Most of it would land in Round 2, on units moving up to engage: 134 of the 180 already falls then. So it taxes exactly the melee approach. It costs nothing on the board. The Overwatch-Ready rule (the unit held its fire for a whole round) keeps it from becoming free.
2. **Armour.** Two forms:
   - TOUGH's save reroll applies against melee and DMG 1 only.
   - Or ranged weapons gain AP 1 at half range or less.

   About 103 ranged attacks a day went into DEF ≤3+ and did 117 HP between them. Either change roughly doubles that, to +100-150 HP, aimed at the elites and knights (Paladins, Custos, Knight-Apostles) and not at chaff. The TOUGH version is cleaner: it is one keyword.
3. **"Hold and fire":** +1 HIT for a ranged attack by a unit that has not moved this Battle Round and is in an Objective Area. Today 26% of ranged attacks are made standing still (94 of 363). This is about +80-100 HP a day, and it rewards a shooter for holding ground, which ties ranged to board presence directly.
4. **Fire into an engagement:** allow it against any target, with the existing 1D6 stray-shot roll, not only when the adjacent friendly units are all EXPENDABLE. This is the biggest change: it removes melee's immunity in Rounds 2-4, when 1,098 HP of melee damage is dealt. It cannot be estimated from Day 1; it needs a batch.
5. **Cost of dedicated guns:**
   - St. Barbara Field Gun 26 → 18.
   - Vermillion Rocket Battery 30 → 22.
   - Morphean Engine 40 → 30.
   - Tsuchigumo Gun Battery 35 → 26.
   - Nicomedean Thunder Tower 45 → 35.

   A cut of 20-30% frees about 8-10 RP per gun, for bodies. Smallest change, safest.

A variant of option 3, **pinning**, is a rule I would only batch-test, not ship from this data: a unit that loses a third of its HP to ranged attacks in one Action Phase takes a MORALE TEST and becomes SUPPRESSED (OC 0) if it fails. It would turn ranged damage into OC denial, but it also helps the COORDINATED SUPPRESSION and STRATEGICAL DISRUPTION Primaries.

My order: 5 and 1 first (low risk, clear evidence), 2 next, 3 or 4 as the larger rule change after a batch.

---

## 5. Army level

### By faction

| faction | sides | W-L | VP for-against | objective VP | armies |
|---|---|---|---|---|---|
| Runeforge Directorate | 2 | 2-0 | 68-31 | 43 | Magdeburg Warhost, Judgement of Odin |
| Ātashid Empire | 2 | 2-0 | 67-26 | 49 | Mihran Spah, Flamewrought Company |
| British Liberation Front | 2 | 2-0 | 66-22 | 43 | Caerfyrddin Fencibles, Knights of Camelot |
| Grand Duchy of Albion | 3 | 2-1 | 84-63 | 42 | Summer Rade, Glandore Breakers / Cosán Sí Host |
| Covenant of New Jerusalem | 8 | 5-3 | 211-170 | 125 | wins: Akathist, Martyrs', Chonae, Cappadocian, Miserere; losses: Popinjay, Belfry, Soudarion |
| Infernal Congregations | 7 | 3-4 | 178-203 | 93 | wins: Sineaters, Veiled Court, Murderhost; losses: Procession, Bailiffs, Ghosts, Lightbearers |
| Caliphate of the Two Sanctuaries | 3 | 1-2 | 69-92 | 33 | Alembic / Sword of Allah, Horns of Hattin |
| Iron Imperium | 7 | **2-5** | 137-188 | 75 | wins: Legio XIII, Alea Iacta; losses: Armoured Cohort, Celeritas, Etna, Protectores, Scorpion Shields |
| Principality of Novgorod | 2 | 0-2 | 40-64 | 21 | Opoki Hundred, Winter Host |
| 11 factions with 1 army | 1 each | - | - | - | one battle each: no faction conclusion |

Player A won 10 of 24; the side with initiative won 9 of 24. That is no significant edge either way (binomial p of about 0.3).

### Armies that look badly built

- **Too few bodies or OC** (all lost; high confidence that this is the cause):

| army | battle | result | units | models | OC | what happened |
|---|---|---|---|---|---|---|
| Protectores Divini Lateris | M13 | 20-32 | 4 | 10 | 11 | lost no units, dealt 30 damage, held 3 VP of objectives a round at most; 0-6 against Akathist in d52n |
| Celeritas Squadron | M03 | 4-32 | 5 | 11 | 15 | 165 of 249 RP in Caesar (Mounted) and Palatine Custos (Mounted); 0 objective VP in all 4 rounds |
| Blaze of Etna | M04 | 12-36 | 6 | 12 | 16 | won the fight 44-25 and lost nothing, but never reached the flank objectives; 0-6 against Bailiffs in d48 |
| Horns of Hattin | M19 | 11-33 | 5 | 18 | 23 | 235 of 248 RP in four mounted elites and characters; 2 objective VP all battle |

  The fix is preset data rather than unit balance: give each one or two cheap OC squads. Or apply the OC proposals in section 2, which reach exactly these units.
- **Mana with no caster.** Every PRAYING Covenant or Commonwealth unit makes Mana, which only a MAGIC_CASTER can spend:
  - Chonae Wing: 29 Mana banked, won.
  - Popinjay Guild: 27, lost 6-32.
  - Belfry Battery: 16, lost 11-36.
  - Oath of Kraków: 15, lost 16-35.
  - Cappadocian Riders: 14, won.

  Casters with Mana banked that hardly cast:
  - Golden Tumen's Black Shaman: 20 Mana, 0 casts.
  - Soudarion Cortege's two Lazarite Prelates: 26 Mana, 2 casts.
  - Walls of Uruk's Asipu Priest: 9 Mana, 0 casts.

  Over all armies, 411 Mana was gained and 102 spent, and 17 of 42 casters never cast. Either add a caster to those five presets, or treat banked Mana as an AI question: the AI may not value Antiphons and Benedictions highly enough.
- **Ranged-heavy Covenant presets**:
  - Popinjay Guild: 12 units, 58 models, 60 OC, 36 damage dealt, lost 6-32.
  - Belfry Battery: lost 11-36.

  Bodies alone did not save them: their guns and snipers scored about 0 (St. Barbara 0.3 VP/100RP, Sniper Hesychast 0, Silver Arrow Brethren 2.1). The gun cost cut in section 4 is aimed at these.
- **Bulava of the Rada** (lost 10-38): 153 of 250 RP destroyed. Ivan Sirko (Mounted) scored 1.6 VP for 75 RP, and its Host Sotnia and Terek riders scored 0.9 and 1.2 VP per copy. One battle only.

---

## 6. Ranked proposals

These are for the user to choose from. Nothing has been changed. "Confidence" is in the evidence that something is wrong, not in the size of the fix.

| # | change | evidence | confidence |
|---|---|---|---|
| 1 | **EPIC HERO characters −10 RP** (70 → 60, 85 → 75). Alternative: +2 OC each | 27 copies, 4.7 VP/100RP (par 9.1), 26/27 survive but deal 7.7 damage per 100 RP; all 27 below par | moderate to high (tier); low per hero |
| 2 | **Low-OC elite squads to 2 OC per model:** Palatine Custos (and **65 → 55 RP**), Palatine Custos (Mounted) (and **75 → 65 RP**), Palatine Artillerists, Consecrated Hussars, Khassakiyya Guard | TOUGH elites at ≤1 OC per model: 5.5 VP/100RP against 11.6 for TOUGH elites at 2 per model; Custos: 0 damage in 3 copies, and poor in 2 older batches | moderate |
| 3 | **Price OC into the cheapest squads:** Covenant Levies 10 → 12, Commandery Bannermen 10 → 12, Parish Militia 13 → 15, Corporaider Squad 22 → 25 | 22-32 VP/100RP; Levies and Bannermen confirmed over 34-42 copies in older batches; template RP charges −0.9 RP per OC | high (Levies, Bannermen); low to moderate (Militia, Corporaiders: 2 armies each) |
| 4 | **Dedicated guns −20-30%:** St. Barbara Field Gun 26 → 18, Vermillion Rocket Battery 30 → 22, Morphean Engine 40 → 30, Tsuchigumo Gun Battery 35 → 26, Nicomedean Thunder Tower 45 → 35 | 18 copies, 2.76 VP/100RP, 0.39 rounds in an Objective Area; Vermillion 2.0 over 12 copies in d67 | moderate (group); low per gun |
| 5 | **Overwatch hits on 5+** | 171 shots, 1.05 HP each, 4 kills; melee wins the battles | moderate (that Overwatch is weak); effect needs a batch |
| 6 | **Legionnaire Squad 20 → 16 RP** | 11 copies, 5.2 VP/100RP (4.0 deployed), 14% of deployed copies survive; in-army index 0.56; older batches mixed (12.0 / 3.6) | moderate |
| 7 | **TOUGH's reroll against ranged only for DMG 1** (or ranged AP 1 at half range) | ranged into DEF 2+/3+ TOUGH: 0.14-1.06 HP per attack, 72-86% blank | moderate (problem); low (size of effect) |
| 8 | Preset fixes: add a caster to Chonae Wing, Popinjay Guild, Belfry Battery, Oath of Kraków and Cappadocian Riders; add 1-2 cheap OC squads to Protectores, Celeritas, Etna and Horns of Hattin | see section 5 | high (that they are mis-built) |
| 9 | Golgothic Paladins: no change yet. Candidates if the batch confirms: Sacred Stigmata does not block counterattacks, then 60 → 70 RP | n = 2; best combat per RP, par on value | low |
| 10 | Larger ranged rules (fire into engagements; "hold and fire"; pinning) | structural (engaged units are immune to ranged fire; SUPPRESSED on 2% of round-ends) | batch first |

Watch list, not to change on Day 1: the single-copy outliers listed in section 1 (Wild Hunt Riders, Peijaiset Wardens, Black Huskarls, Assault Lycanthropes, Michaelite Brethren, Babylonian Assassin; Bogatyr Thunderguards, Knight-Scourgers, Leshen Besieger, Bounded Ifrit, Comitatus Armored Carrier).

### Batches to play to confirm the top ones

These are 8 games each on the current build, with `WARFRONT_OUTPUT_DIR` set as for Day 1. Every preset has `doctrineId: "none"`, so they match Day 1's no-doctrine setting. Play each before and after the change on a trial build.

```
# 1. EPIC HERO price: hero-heavy armies against normal ones
node scripts/battle_report/batch.cjs b-celeritas-akathist --a iron_imperium/preset:celeritas_squadron --b covenant_of_new_jerusalem/preset:weeping_veil_host --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-horns-cappadocian --a caliphate_of_the_two_sanctuaries/preset:horns_of_hattin --b covenant_of_new_jerusalem/preset:dragonslayer_lances --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-ramesses-genghis --a duat_dominion/preset:ramesses_army --b golden_khaganate/preset:genghis_army --games 8 --map CROSSROADS
# 2. Low-OC elites (Palatine Custos, Hussars)
node scripts/battle_report/batch.cjs b-palatine-mouseion --a iron_imperium/preset:palatine_guard --b panhellenic_league/preset:heron_army --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-krakow-martyrs --a polish_lithuanian_ruthenian_commonwealth/preset:kosciuszko_army --b covenant_of_new_jerusalem/preset:true_cross_host --games 8 --map CROSSROADS
# 3. Cheap OC (Levies, Bannermen, Militia)
node scripts/battle_report/batch.cjs b-longwu-lightbearers --a jade_mandate/preset:five_banner_army --b infernal_congregations/preset:dawn_king_army --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-etna-fencibles --a iron_imperium/preset:artificer_forge --b british_liberation_front/preset:caerfyrddin_fencibles --games 8 --map CROSSROADS
# 4-5. Guns and Overwatch
node scripts/battle_report/batch.cjs b-popinjay-alea --a covenant_of_new_jerusalem/preset:popinjay_guild --b iron_imperium/preset:alea_iacta --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-belfry-flamewrought --a covenant_of_new_jerusalem/preset:brazen_tower_battery --b atashid_empire/preset:flamebringer_immortals --games 8 --map CROSSROADS
# 9. Golgothic Paladins: both Paladin armies, against a melee, a gun and an elite army
node scripts/battle_report/batch.cjs b-martyrs-scorpion --a covenant_of_new_jerusalem/preset:true_cross_host --b iron_imperium/preset:scorpion_shields --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-miserere-summer --a covenant_of_new_jerusalem/preset:penitent_crusade --b grand_duchy_of_albion/preset:finvarra_army --games 8 --map CROSSROADS
node scripts/battle_report/batch.cjs b-miserere-murderhost --a covenant_of_new_jerusalem/preset:penitent_crusade --b infernal_congregations/preset:hegemon_army --games 8 --map CROSSROADS
```

For the Paladins, also play the same two Covenant presets with the Paladins swapped for 60 RP of Knight-Apostles. That measures their marginal value directly, which Shapley VP cannot.

For proposal 1, a price cut only shows in a batch if the freed RP is spent. Re-cost the presets (for example, add a cheap squad with the 10 RP) before the "after" run.

---

## Appendix: every unit type

From `appendix.cjs`:
- **n** is the number of copies; "a" counts copies that arrived through a Troop Requisition.
- **(C)** marks a CHARACTER.
- **OC x/0** is a flyer: x on the ground, 0 in the air.
- **RP-eq** is the shrunk excess in RP, on VP and on value (VP + kill denial).
- **taken/HP** is damage taken against starting HP.
- **idle** is idle rounds per copy; **rds on obj** is rounds per copy ending in an Objective Area.
- The rows are sorted by RP-eq on VP.

Par: 9.07 VP per 100 RP (Shapley VP); 10.23 per 100 RP (VP + kill denial, 2.20 VP per 100 RP per Battle Round on the board). Shrinkage: within-type SD 2.42 VP, between-type SD 1.56 VP.

| unit | faction | n | RP | OC | VP/copy | VP/100RP | obj VP | hinged | RP-eq (VP) | value/copy | RP-eq (value) | dmg/copy | dmg/100RP | RP killed | taken/HP | surv | idle | rds on obj | W | battles |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wild Hunt Riders | grand duchy | 1 | 25 | 5 | 11.2 | 44.9 | 7.0 | 7.0 | +29 | 12.4 | +31 | 21.0 | 84 | 38 | 6.0/10 | 100% | 1.0 | 4.0 | 1/1 | M10 |
| Peijaiset Wardens | kalevan kansa | 1 | 40 | 10 | 12.4 | 31.0 | 7.5 | 9.0 | +28 | 14.6 | +32 | 18.0 | 45 | 55 | 8.0/20 | 100% | 1.0 | 5.0 | 1/1 | M05 |
| Black Huskarls | runeforge directorate | 1 | 32 | 5 | 10.7 | 33.3 | 8.0 | 8.0 | +25 | 12.0 | +27 | 13.0 | 41 | 20 | 2.0/10 | 100% | 2.0 | 4.0 | 1/1 | M02 |
| Corporaider Squad | runeforge directorate | 6 | 22 | 10 | 5.1 | 23.2 | 3.7 | 3.2 | +25 | 5.3 | +22 | 8.2 | 37 | 5 | 4.3/10 | 83% | 1.5 | 2.2 | 6/6 | M02 M12 |
| Basajaun Smith | euskal herria | 1 | 45 | 2 | 11.5 | 25.6 | 10.0 | 10.0 | +24 | 11.5 | +21 | 0.0 | 0 | 0 | 0.0/10 | 100% | 6.0 | 5.0 | 0/1 | M11 |
| Parish Militia | british liberation | 6 (1a) | 13 | 10 | 4.2 | 32.1 | 3.1 | 2.0 | +24 | 4.4 | +22 | 0.8 | 6 | 5 | 6.0/20 | 83% | 2.0 | 2.0 | 6/6 | M04 M09 |
| Asipu Priest (C) | mat akkadi | 1 | 18 | 1 | 8.5 | 47.2 | 3.0 | 4.0 | +22 | 8.5 | +21 | 16.0 | 89 | 0 | 5.0/5 | 0% | 1.0 | 3.0 | 0/1 | M14 |
| Assault Lycanthropes | church beast | 1 | 30 | 5 | 9.0 | 30.0 | 4.0 | 4.0 | +20 | 12.2 | +28 | 32.0 | 107 | 43 | 9.0/20 | 100% | 2.0 | 3.0 | 1/1 | M07 |
| Stormlord (C) | golden khaganate | 1 | 23 | 2 | 8.3 | 36.0 | 3.6 | 3.0 | +20 | 8.3 | +18 | 3.0 | 13 | 0 | 2.0/8 | 100% | 2.0 | 4.0 | 1/1 | M16 |
| Babylonian Assassin | infernal congregations | 2 | 24 | 3 | 6.1 | 25.4 | 4.0 | 4.5 | +20 | 9.0 | +31 | 18.0 | 75 | 32 | 1.5/3 | 50% | 3.0 | 4.0 | 2/2 | M14 |
| Wendigo Manreaver | church beast | 1 | 50 | 3 | 10.5 | 21.0 | 6.0 | 6.0 | +19 | 10.9 | +18 | 18.0 | 36 | 18 | 7.0/18 | 100% | 1.0 | 5.0 | 1/1 | M07 |
| Oni Samurai | empire nihon | 1 | 40 | 6 | 9.5 | 23.8 | 6.5 | 6.0 | +19 | 12.6 | +26 | 30.0 | 75 | 30 | 15.0/12 | 0% | 2.0 | 5.0 | 0/1 | M18 |
| Commandery Bannermen | jade mandate | 8 (2a) | 10 | 5 | 3.1 | 30.7 | 1.7 | 2.1 | +18 | 3.2 | +17 | 1.9 | 19 | 2 | 2.8/10 | 75% | 1.0 | 1.1 | 8/8 | M23 |
| Hellkin | infernal congregations | 2 | 25 | 5 | 5.7 | 22.7 | 4.1 | 3.0 | +17 | 5.7 | +15 | 3.5 | 14 | 0 | 5.0/20 | 100% | 3.5 | 2.5 | 1/2 | M01 M11 |
| Fulminator Squad | iron imperium | 1 | 20 | 3 | 7.0 | 35.0 | 7.0 | 6.0 | +17 | 7.0 | +15 | 1.0 | 5 | 0 | 0.0/6 | 100% | 6.0 | 4.0 | 1/1 | M08 |
| Beast of Contagion (C) | infernal congregations | 1 | 50 | 2 | 9.4 | 18.9 | 8.0 | 8.0 | +16 | 13.0 | +24 | 10.0 | 20 | 36 | 0.0/15 | 100% | 4.0 | 5.0 | 1/1 | M11 |
| Aswaran | atashid empire | 2 | 38 | 6 | 6.6 | 17.5 | 6.0 | 5.0 | +16 | 6.8 | +14 | 6.5 | 17 | 5 | 7.0/12 | 100% | 2.0 | 5.0 | 2/2 | M01 |
| Michaelite Brethren | covenant jerusalem | 2 | 40 | 6 | 6.6 | 16.6 | 1.0 | 0.0 | +15 | 10.3 | +29 | 30.0 | 75 | 67 | 4.0/12 | 100% | 1.0 | 3.0 | 2/2 | M15 |
| Avatar of Wrath (C) | infernal congregations | 1 | 60 | 2 | 10.0 | 16.7 | 7.0 | 8.0 | +15 | 10.0 | +12 | 5.0 | 8 | 0 | 1.0/12 | 100% | 3.0 | 5.0 | 1/1 | M18 |
| Ashur Breachguard | mat akkadi | 1 | 30 | 3 | 7.0 | 23.3 | 0.0 | 0.0 | +14 | 8.7 | +17 | 22.0 | 73 | 34 | 3.0/9 | 100% | 2.0 | 3.0 | 0/1 | M14 |
| Covenant Levies | covenant jerusalem | 37 (10a) | 10 | 10 | 2.2 | 22.4 | 1.8 | 1.4 | +14 | 2.3 | +12 | 2.1 | 21 | 2 | 7.5/20 | 81% | 1.5 | 1.3 | 25/37 | M03 M06 M15 M19 M20 M21 M22 M24 |
| Royal Alchemist (C) | caliphate sanctuaries | 1 | 25 | 1 | 6.5 | 26.0 | 5.0 | 6.0 | +14 | 6.5 | +12 | 0.0 | 0 | 0 | 2.0/5 | 100% | 1.0 | 5.0 | 1/1 | M22 |
| Praetorian Strikers | iron imperium | 2 | 38 | 6 | 6.1 | 16.3 | 3.5 | 4.0 | +14 | 7.3 | +16 | 23.5 | 63 | 13 | 6.0/9 | 50% | 2.5 | 3.0 | 0/2 | M24 |
| Redcap Reivers | grand duchy | 1 | 24 | 5 | 6.4 | 26.6 | 4.0 | 4.0 | +14 | 6.4 | +12 | 16.0 | 67 | 0 | 0.0/10 | 100% | 5.0 | 2.0 | 1/1 | M10 |
| Sidhe Wardens | grand duchy | 9 (1a) | 18 | 10 | 3.2 | 17.8 | 1.8 | 1.7 | +14 | 4.1 | +18 | 7.7 | 43 | 14 | 4.0/5 | 44% | 1.0 | 1.7 | 7/9 | M09 M10 M17 |
| Armored Gashadokuro | empire nihon | 1 | 55 | 3 | 9.0 | 16.4 | 9.0 | 8.0 | +13 | 9.0 | +10 | 12.0 | 22 | 0 | 0.0/16 | 100% | 5.0 | 6.0 | 0/1 | M18 |
| Ironthunder Vanguard | iron imperium | 4 | 36 | 6 | 5.1 | 14.0 | 4.0 | 2.3 | +12 | 7.4 | +23 | 20.3 | 56 | 31 | 3.3/12 | 100% | 3.3 | 2.5 | 4/4 | M08 M20 |
| Asklepian Medic (C) | panhellenic league | 1 | 13 | 1 | 4.9 | 37.8 | 0.7 | 0.0 | +12 | 4.9 | +11 | 0.0 | 0 | 0 | 0.0/5 | 100% | 4.0 | 1.0 | 1/1 | M13 |
| Heliostat Battery | panhellenic league | 1 | 30 | 1 | 6.4 | 21.4 | 4.7 | 4.0 | +12 | 6.4 | +10 | 4.0 | 13 | 0 | 0.0/5 | 100% | 3.0 | 3.0 | 1/1 | M13 |
| Tysyatsky (C) | principality novgorod | 2 | 25 | 2 | 4.5 | 18.1 | 2.1 | 2.5 | +11 | 4.5 | +9 | 5.0 | 20 | 0 | 2.0/8 | 100% | 1.0 | 4.5 | 0/2 | M05 |
| Khesig Guards | golden khaganate | 2 | 35 | 6 | 5.3 | 15.1 | 2.5 | 2.5 | +11 | 5.3 | +8 | 3.0 | 9 | 0 | 5.0/12 | 100% | 0.5 | 3.0 | 2/2 | M16 |
| Abna al-Dawla Guard | caliphate sanctuaries | 2 | 36 | 5 | 5.2 | 14.5 | 2.5 | 3.5 | +10 | 5.7 | +10 | 19.5 | 54 | 8 | 4.5/15 | 100% | 2.0 | 3.0 | 1/2 | M07 M22 |
| Muqatila Troopers | caliphate sanctuaries | 10 (2a) | 13 | 10 | 2.3 | 17.4 | 1.6 | 1.6 | +10 | 2.3 | +8 | 4.1 | 32 | 1 | 15.1/20 | 50% | 1.1 | 1.8 | 5/10 | M07 M19 M22 |
| Ashen Chirurgeon (C) | infernal congregations | 2 | 12 | 1 | 3.0 | 25.0 | 1.5 | 1.0 | +10 | 3.0 | +8 | 2.5 | 21 | 0 | 6.5/6 | 0% | 2.0 | 2.0 | 0/2 | M23 |
| Goetic Ophanim (C) | infernal congregations | 1 | 45 | 2 | 7.0 | 15.6 | 4.0 | 4.0 | +9 | 7.0 | +7 | 11.0 | 24 | 0 | 1.0/10 | 100% | 1.0 | 3.0 | 0/1 | M23 |
| Cyclopean Ferricants | iron imperium | 1 | 38 | 6 | 6.3 | 16.7 | 4.0 | 3.0 | +9 | 6.3 | +8 | 5.0 | 13 | 0 | 4.0/12 | 100% | 3.0 | 2.0 | 0/1 | M04 |
| Nostovaki Militia | kalevan kansa | 3 | 18 | 10 | 3.1 | 17.3 | 1.8 | 2.3 | +9 | 3.1 | +7 | 5.3 | 30 | 0 | 13.3/20 | 100% | 1.7 | 2.0 | 3/3 | M05 |
| Knight-Excisors | british liberation | 1 | 44 | 6 | 6.7 | 15.1 | 3.5 | 0.0 | +9 | 7.4 | +9 | 2.0 | 5 | 17 | 8.0/12 | 100% | 0.0 | 5.0 | 1/1 | M09 |
| Javidan Immortals | atashid empire | 4 | 30 | 10 | 3.9 | 13.0 | 3.8 | 3.5 | +8 | 4.6 | +10 | 9.0 | 30 | 16 | 4.3/15 | 100% | 3.5 | 2.3 | 4/4 | M01 M21 |
| Forsaken | infernal congregations | 1 | 7 | 0 | 3.0 | 42.9 | 0.0 | 0.0 | +8 | 4.6 | +12 | 6.0 | 86 | 18 | 9.0/10 | 0% | 1.0 | 0.0 | 0/1 | M08 |
| Odin's Einherjar | runeforge directorate | 2 | 38 | 6 | 5.0 | 13.0 | 3.0 | 3.0 | +8 | 5.0 | +5 | 3.0 | 8 | 0 | 7.5/12 | 100% | 3.5 | 2.5 | 2/2 | M02 M12 |
| Eire Pathfinders | british liberation | 1 | 18 | 3 | 3.9 | 21.5 | 2.7 | 2.0 | +7 | 3.9 | +6 | 0.0 | 0 | 0 | 0.0/6 | 100% | 3.0 | 2.0 | 1/1 | M04 |
| Knight-Apostle Squad | covenant jerusalem | 3 | 35 | 6 | 4.4 | 12.5 | 1.6 | 1.0 | +7 | 6.3 | +16 | 15.7 | 45 | 36 | 4.0/12 | 67% | 0.7 | 2.0 | 2/3 | M06 M21 M24 |
| Field Confessor (C) | covenant jerusalem | 1 | 20 | 1 | 4.0 | 20.0 | 4.0 | 0.0 | +7 | 4.0 | +6 | 0.0 | 0 | 0 | 0.0/5 | 100% | 2.0 | 4.0 | 1/1 | M03 |
| Veche Levy | principality novgorod | 6 | 16 | 10 | 2.3 | 14.4 | 1.5 | 1.5 | +7 | 2.5 | +7 | 3.7 | 23 | 3 | 15.5/20 | 67% | 1.3 | 1.8 | 0/6 | M05 M17 |
| Cultist Troopers | infernal congregations | 25 (13a) | 10 | 10 | 1.6 | 15.6 | 0.9 | 0.7 | +7 | 1.7 | +6 | 1.9 | 19 | 3 | 11.0/20 | 60% | 1.2 | 1.1 | 9/25 | M01 M08 M11 M12 M14 M18 M23 |
| League Hoplite | panhellenic league | 2 | 20 | 10 | 3.1 | 15.6 | 2.0 | 2.0 | +7 | 3.1 | +5 | 1.0 | 5 | 0 | 4.0/10 | 100% | 3.5 | 1.0 | 2/2 | M13 |
| Briton Yeomen | grand duchy | 2 | 15 | 10 | 2.6 | 17.5 | 1.3 | 0.0 | +6 | 2.6 | +5 | 2.5 | 17 | 0 | 10.0/20 | 50% | 2.0 | 1.0 | 2/2 | M17 |
| Terracotta Vanguard | jade mandate | 1 | 15 | 3 | 3.3 | 21.8 | 2.5 | 3.0 | +6 | 3.3 | +5 | 0.0 | 0 | 0 | 6.0/9 | 100% | 3.0 | 3.0 | 1/1 | M23 |
| Crimson Knights | covenant jerusalem | 2 | 50 | 6 | 5.7 | 11.5 | 4.5 | 5.5 | +6 | 5.7 | +3 | 13.0 | 26 | 0 | 2.0/15 | 100% | 2.5 | 3.5 | 2/2 | M19 |
| Cantor-Preceptor (C) | covenant jerusalem | 2 | 21 | 1 | 3.0 | 14.5 | 0.8 | 0.0 | +6 | 3.0 | +4 | 0.0 | 0 | 0 | 3.0/4 | 50% | 1.0 | 1.5 | 2/2 | M06 M24 |
| Praetorian Tribune (C) | iron imperium | 2 | 33 | 2 | 4.1 | 12.6 | 1.8 | 1.5 | +6 | 5.2 | +9 | 7.0 | 22 | 21 | 3.0/6 | 50% | 3.5 | 3.0 | 0/2 | M24 |
| Champion of Mars (C) | iron imperium | 1 | 45 | 2 | 5.8 | 13.0 | 5.0 | 2.0 | +6 | 5.8 | +4 | 0.0 | 0 | 0 | 6.0/8 | 100% | 4.0 | 4.0 | 1/1 | M20 |
| Hounds of Satan | infernal congregations | 2 | 20 | 5 | 2.8 | 14.2 | 1.5 | 1.5 | +5 | 2.8 | +4 | 0.0 | 0 | 0 | 5.0/10 | 50% | 2.0 | 3.0 | 2/2 | M18 |
| Argyraspides | panhellenic league | 2 | 38 | 10 | 4.5 | 11.7 | 2.3 | 1.5 | +5 | 4.5 | +3 | 0.0 | 0 | 0 | 2.0/15 | 100% | 2.5 | 2.0 | 2/2 | M13 |
| Azure Banner Braves | jade mandate | 1 | 30 | 5 | 4.3 | 14.2 | 1.0 | 0.0 | +5 | 4.8 | +5 | 4.0 | 13 | 12 | 4.0/10 | 100% | 2.0 | 1.0 | 1/1 | M23 |
| Akhguard | duat dominion | 1 | 35 | 10 | 4.7 | 13.3 | 1.7 | 0.0 | +5 | 5.5 | +6 | 29.0 | 83 | 30 | 0.0/15 | 100% | 1.0 | 2.0 | 0/1 | M16 |
| Sagdid Hound-Keepers | atashid empire | 6 (3a) | 10 | 3 | 1.4 | 14.4 | 0.9 | 0.5 | +4 | 1.4 | +3 | 3.7 | 37 | 0 | 2.2/6 | 83% | 0.7 | 1.2 | 6/6 | M01 M21 |
| Azat Lancers | kingdom hayk | 2 | 30 | 10 | 3.5 | 11.8 | 0.8 | 0.0 | +4 | 3.5 | +2 | 1.0 | 3 | 0 | 20.0/20 | 0% | 2.0 | 1.0 | 0/2 | M10 |
| Knight-Banneret (C) | british liberation | 1 | 33 | 3 | 4.2 | 12.6 | 4.0 | 0.0 | +4 | 4.2 | +2 | 3.0 | 9 | 0 | 0.0/8 | 100% | 4.0 | 4.0 | 1/1 | M09 |
| Black Shaman (C) | golden khaganate | 1 | 18 | 1 | 2.8 | 15.5 | 1.1 | 0.0 | +4 | 2.8 | +3 | 0.0 | 0 | 0 | 3.0/5 | 100% | 2.0 | 2.0 | 1/1 | M16 |
| Stormrider | golden khaganate | 1 | 20 | 5 | 2.9 | 14.6 | 1.4 | 0.0 | +4 | 2.9 | +3 | 0.0 | 0 | 0 | 20.0/20 | 0% | 2.0 | 2.0 | 1/1 | M16 |
| Akritic Outriders | covenant jerusalem | 2 | 22 | 3 | 2.7 | 12.3 | 2.0 | 2.0 | +4 | 2.7 | +2 | 0.0 | 0 | 0 | 7.0/9 | 50% | 1.0 | 1.5 | 1/2 | M19 M20 |
| Shieldbearers | atashid empire | 4 | 17 | 10 | 2.0 | 12.0 | 1.3 | 0.8 | +3 | 2.0 | +2 | 4.5 | 26 | 0 | 8.0/10 | 50% | 1.8 | 1.5 | 4/4 | M01 M21 |
| Moonless Veilblades | grand duchy | 1 | 30 | 3 | 3.7 | 12.4 | 3.0 | 2.0 | +3 | 5.7 | +8 | 42.0 | 140 | 30 | 0.0/3 | 100% | 2.0 | 3.0 | 1/1 | M10 |
| House of Glass Arcanist (C) | british liberation | 1 | 22 | 1 | 2.9 | 13.1 | 1.7 | 0.0 | +3 | 2.9 | +2 | 0.0 | 0 | 0 | 0.0/5 | 100% | 1.0 | 2.0 | 1/1 | M04 |
| Abbatissa Dolorosa (C) | covenant jerusalem | 1 | 30 | 2 | 3.6 | 11.9 | 1.5 | 3.0 | +3 | 7.1 | +12 | 0.0 | 0 | 80 | 0.0/7 | 100% | 2.0 | 3.0 | 1/1 | M03 |
| Master of Coin (C) | infernal congregations | 1 | 35 | 2 | 4.0 | 11.4 | 2.0 | 0.0 | +3 | 5.3 | +5 | 2.0 | 6 | 20 | 0.0/8 | 100% | 3.0 | 2.0 | 0/1 | M08 |
| Weretiger Stalkers | church beast | 1 | 30 | 3 | 3.5 | 11.7 | 3.5 | 9.0 | +3 | 3.5 | +1 | 0.0 | 0 | 0 | 0.0/12 | 100% | 5.0 | 4.0 | 1/1 | M07 |
| Furyforged Berserkers | infernal congregations | 2 | 25 | 0 | 2.8 | 11.0 | 0.0 | 0.0 | +2 | 4.6 | +9 | 21.0 | 84 | 25 | 6.0/10 | 50% | 3.0 | 1.0 | 2/2 | M18 |
| Lazarite Prelate (C) | covenant jerusalem | 2 | 25 | 1 | 2.8 | 11.0 | 0.0 | 0.0 | +2 | 2.8 | +1 | 3.5 | 14 | 0 | 0.0/6 | 100% | 2.0 | 1.5 | 0/2 | M22 |
| Alba Highlanders | british liberation | 1 | 26 | 5 | 3.1 | 11.8 | 2.0 | 2.0 | +2 | 3.1 | +1 | 6.0 | 23 | 0 | 0.0/10 | 100% | 3.0 | 1.0 | 1/1 | M04 |
| Nerge Outriders | golden khaganate | 1 | 18 | 3 | 2.3 | 12.5 | 1.5 | 3.0 | +2 | 2.3 | +1 | 1.0 | 6 | 0 | 0.0/6 | 100% | 0.0 | 2.0 | 1/1 | M16 |
| Dream-Reader of Tir (C) | kingdom hayk | 1 | 18 | 1 | 2.2 | 12.4 | 1.0 | 0.0 | +2 | 2.2 | +1 | 0.0 | 0 | 0 | 4.0/4 | 0% | 2.0 | 1.0 | 0/1 | M10 |
| Temple Levy | infernal congregations | 3 | 15 | 10 | 1.7 | 11.1 | 0.3 | 0.7 | +2 | 2.5 | +5 | 5.0 | 33 | 7 | 19.0/20 | 0% | 1.0 | 1.3 | 1/3 | M14 |
| Dragoon Brethren | covenant jerusalem | 1 | 45 | 3 | 4.6 | 10.1 | 3.5 | 9.0 | +2 | 5.1 | +2 | 20.0 | 44 | 13 | 1.0/12 | 100% | 1.0 | 3.0 | 1/1 | M19 |
| Hersir (C) | runeforge directorate | 1 | 28 | 1 | 3.0 | 10.8 | 2.0 | 0.0 | +2 | 3.0 | +0 | 5.0 | 18 | 0 | 0.0/6 | 100% | 1.0 | 4.0 | 1/1 | M12 |
| Beast-Monk (C) | church beast | 1 | 17 | 1 | 2.0 | 11.8 | 0.0 | 0.0 | +1 | 2.6 | +3 | 6.0 | 35 | 13 | 0.0/7 | 100% | 1.0 | 4.0 | 1/1 | M07 |
| Seven-Sword Intercessor (C) | covenant jerusalem | 1 | 35 | 2 | 3.6 | 10.2 | 1.5 | 3.0 | +1 | 5.1 | +5 | 5.0 | 14 | 24 | 0.0/8 | 100% | 3.0 | 3.0 | 1/1 | M03 |
| Sorgin (C) | euskal herria | 1 | 18 | 1 | 2.0 | 11.1 | 2.0 | 2.0 | +1 | 2.0 | +0 | 0.0 | 0 | 0 | 4.0/4 | 0% | 1.0 | 1.0 | 0/1 | M11 |
| Commonwealth Fusiliers | polish lithuanian | 3 | 12 | 10 | 1.2 | 10.2 | 0.9 | 0.7 | +1 | 1.2 | -0 | 2.7 | 22 | 0 | 10.0/10 | 0% | 1.3 | 1.3 | 0/3 | M06 |
| Knight-Ascendants | british liberation | 1 | 43 | 6 | 4.2 | 9.7 | 4.0 | 0.0 | +1 | 4.2 | -1 | 0.0 | 0 | 0 | 3.0/12 | 100% | 5.0 | 4.0 | 1/1 | M09 |
| Mongrel Supplicants | church beast | 1 | 14 | 10 | 1.5 | 10.7 | 1.5 | 3.0 | +1 | 1.5 | +0 | 0.0 | 0 | 0 | 19.0/20 | 0% | 1.0 | 2.0 | 1/1 | M07 |
| Skeletal Archer | duat dominion | 4 (2a) | 10 | 10 | 1.0 | 10.0 | 1.0 | 0.8 | +1 | 1.0 | -0 | 6.3 | 63 | 0 | 3.0/10 | 100% | 1.0 | 0.5 | 0/4 | M16 |
| Seraph of Evolution (C) | infernal congregations | 1 | 70 | 5 | 6.5 | 9.3 | 4.0 | 3.0 | +1 | 8.1 | +3 | 9.0 | 13 | 24 | 6.0/12 | 100% | 2.0 | 5.0 | 0/1 | M23 |
| Rotmistrz (C) | polish lithuanian | 1 | 23 | 1 | 2.2 | 9.4 | 0.7 | 0.0 | +0 | 2.2 | -1 | 7.0 | 30 | 0 | 0.0/6 | 100% | 3.0 | 1.0 | 0/1 | M06 |
| Lamassu Bastion | mat akkadi | 1 | 60 | 4 | 5.5 | 9.2 | 4.0 | 4.0 | +0 | 5.5 | -2 | 12.0 | 20 | 0 | 0.0/14 | 100% | 3.0 | 2.0 | 0/1 | M14 |
| Kitsune Shinobi | empire nihon | 1 | 22 | 3 | 2.0 | 9.1 | 2.0 | 2.0 | +0 | 2.0 | -1 | 0.0 | 0 | 0 | 5.0/6 | 0% | 1.0 | 2.0 | 0/1 | M18 |
| Fey Lord (C) | grand duchy | 1 | 18 | 1 | 1.6 | 8.8 | 1.0 | 0.0 | -0 | 1.6 | -1 | 0.0 | 0 | 0 | 0.0/4 | 100% | 1.0 | 3.0 | 1/1 | M17 |
| High King Finvarra (C) | grand duchy | 1 | 70 | 5 | 6.2 | 8.9 | 4.0 | 3.0 | -0 | 6.2 | -3 | 0.0 | 0 | 0 | 1.0/8 | 100% | 1.0 | 3.0 | 1/1 | M10 |
| Coblynau Sappers | grand duchy | 2 | 12 | 3 | 1.0 | 8.3 | 0.0 | 0.0 | -0 | 1.0 | -1 | 0.0 | 0 | 0 | 0.0/6 | 100% | 1.5 | 0.0 | 0/2 | M09 |
| Cultist Zealots | infernal congregations | 3 | 10 | 0 | 0.8 | 8.3 | 0.3 | 0.7 | -0 | 1.9 | +5 | 9.7 | 97 | 17 | 9.7/20 | 67% | 2.0 | 2.3 | 3/3 | M18 |
| Canopic Priest (C) | duat dominion | 1 | 22 | 1 | 1.7 | 7.6 | 0.7 | 0.0 | -1 | 1.7 | -2 | 0.0 | 0 | 0 | 0.0/4 | 100% | 1.0 | 2.0 | 0/1 | M16 |
| Morrigan's Chosen (C) | grand duchy | 1 | 22 | 2 | 1.7 | 7.6 | 0.5 | 0.0 | -1 | 1.7 | -2 | 24.0 | 109 | 0 | 1.0/4 | 100% | 1.0 | 4.0 | 1/1 | M17 |
| Genghis Khan - The Stormborn Conqueror (C) | golden khaganate | 1 | 70 | 5 | 6.0 | 8.5 | 1.0 | 2.0 | -1 | 6.7 | -1 | 14.0 | 20 | 35 | 0.0/12 | 100% | 0.0 | 2.0 | 1/1 | M16 |
| Spahbed (C) | atashid empire | 1 | 50 | 3 | 4.1 | 8.1 | 4.0 | 2.0 | -2 | 4.1 | -3 | 2.0 | 4 | 0 | 0.0/6 | 100% | 5.0 | 5.0 | 1/1 | M01 |
| Parsawor Grenadiers | kingdom hayk | 1 | 20 | 3 | 1.3 | 6.7 | 1.0 | 0.0 | -2 | 2.7 | +2 | 7.0 | 35 | 32 | 6.0/6 | 0% | 1.0 | 2.0 | 0/1 | M10 |
| Adur Furnace Guard | atashid empire | 2 | 20 | 3 | 1.5 | 7.5 | 1.5 | 1.5 | -2 | 1.5 | -3 | 0.0 | 0 | 0 | 0.0/6 | 100% | 4.0 | 0.5 | 2/2 | M21 |
| Barghest | grand duchy | 1 | 30 | 0 | 2.2 | 7.4 | 0.0 | 0.0 | -2 | 2.2 | -3 | 0.0 | 0 | 0 | 1.0/7 | 100% | 3.0 | 1.0 | 0/1 | M09 |
| War-Taoist (C) | jade mandate | 1 | 20 | 1 | 1.3 | 6.6 | 0.0 | 0.0 | -2 | 1.3 | -2 | 0.0 | 0 | 0 | 0.0/4 | 100% | 1.0 | 0.0 | 1/1 | M23 |
| Caesar - Divus Imperator (C) | iron imperium | 1 | 75 | 5 | 6.2 | 8.3 | 4.0 | 0.0 | -2 | 6.2 | -4 | 4.0 | 5 | 0 | 0.0/8 | 100% | 1.0 | 4.0 | 1/1 | M20 |
| Mawkin | infernal congregations | 2 | 28 | 0 | 2.2 | 7.7 | 0.0 | 0.0 | -2 | 2.5 | -2 | 15.5 | 55 | 8 | 12.0/20 | 100% | 2.5 | 1.0 | 2/2 | M11 |
| Tamga-Bound Troops | golden khaganate | 5 (2a) | 10 | 10 | 0.7 | 6.5 | 0.3 | 0.6 | -2 | 0.7 | -2 | 3.0 | 30 | 2 | 9.2/20 | 80% | 0.6 | 0.8 | 5/5 | M16 |
| Silesian Hammerguards | polish lithuanian | 1 | 40 | 10 | 3.0 | 7.5 | 1.5 | 0.0 | -2 | 3.0 | -3 | 0.0 | 0 | 0 | 10.0/10 | 0% | 1.0 | 1.0 | 0/1 | M06 |
| Shieldmaidens | runeforge directorate | 1 | 30 | 3 | 2.0 | 6.7 | 0.5 | 0.0 | -2 | 2.0 | -3 | 6.0 | 20 | 0 | 2.0/6 | 100% | 1.0 | 4.0 | 1/1 | M12 |
| Marrowstring Centaur | church beast | 1 | 30 | 3 | 2.0 | 6.7 | 2.0 | 6.0 | -2 | 2.0 | -3 | 9.0 | 30 | 0 | 0.0/15 | 100% | 1.0 | 4.0 | 1/1 | M07 |
| Cliodhna - The Dread Tide (C) | grand duchy | 1 | 65 | 5 | 5.1 | 7.8 | 3.0 | 0.0 | -3 | 5.7 | -3 | 11.0 | 17 | 30 | 0.0/7 | 100% | 1.0 | 4.0 | 1/1 | M17 |
| Maphorion Nuns | covenant jerusalem | 1 | 40 | 5 | 2.8 | 7.0 | 2.8 | 3.0 | -3 | 2.8 | -4 | 8.0 | 20 | 0 | 4.0/10 | 100% | 2.0 | 3.0 | 1/1 | M03 |
| Reedfire Champion (C) | kingdom hayk | 1 | 22 | 1 | 1.2 | 5.3 | 0.0 | 0.0 | -3 | 1.2 | -3 | 0.0 | 0 | 0 | 0.0/6 | 100% | 5.0 | 0.0 | 0/1 | M10 |
| Rynda Guard | principality novgorod | 1 | 35 | 5 | 2.3 | 6.7 | 2.0 | 0.0 | -3 | 2.3 | -4 | 5.0 | 14 | 0 | 6.0/15 | 100% | 1.0 | 2.0 | 0/1 | M17 |
| Knight-Commander (C) | covenant jerusalem | 1 | 26 | 3 | 1.5 | 5.8 | 1.0 | 2.0 | -3 | 1.9 | -2 | 8.0 | 31 | 20 | 0.0/10 | 100% | 0.0 | 2.0 | 0/1 | M20 |
| Palatine Artillerists | iron imperium | 1 | 70 | 3 | 5.4 | 7.7 | 3.3 | 3.0 | -3 | 6.1 | -3 | 14.0 | 20 | 16 | 4.0/12 | 100% | 1.0 | 3.0 | 0/1 | M13 |
| Sepulchre Guard | covenant jerusalem | 2 | 43 | 6 | 3.3 | 7.6 | 0.5 | 0.0 | -3 | 4.0 | -2 | 18.5 | 44 | 7 | 1.0/15 | 100% | 3.5 | 1.5 | 0/2 | M22 |
| Malleus Sappers | iron imperium | 1 | 25 | 3 | 1.3 | 5.3 | 0.0 | 0.0 | -3 | 1.3 | -4 | 3.0 | 12 | 0 | 0.0/9 | 100% | 1.0 | 3.0 | 0/1 | M03 |
| Praetorian Gunners | iron imperium | 2 | 38 | 6 | 2.8 | 7.4 | 1.8 | 2.5 | -3 | 2.8 | -5 | 9.5 | 25 | 0 | 9.0/9 | 0% | 0.5 | 2.0 | 0/2 | M24 |
| Stygian Actuary (C) | infernal congregations | 1 | 16 | 0 | 0.5 | 3.1 | 0.0 | 0.0 | -3 | 0.5 | -4 | 0.0 | 0 | 0 | 4.0/6 | 100% | 2.0 | 0.0 | 0/1 | M08 |
| Heron of Alexandria (C) | panhellenic league | 1 | 55 | 3 | 4.0 | 7.3 | 1.0 | 0.0 | -3 | 4.0 | -5 | 0.0 | 0 | 0 | 2.0/7 | 100% | 3.0 | 3.0 | 1/1 | M13 |
| Ashigaru Riflemen | empire nihon | 3 | 15 | 10 | 0.8 | 5.6 | 0.8 | 0.0 | -3 | 0.8 | -4 | 0.3 | 2 | 0 | 19.0/20 | 0% | 1.7 | 0.7 | 0/3 | M18 |
| Rootwall Dryads | grand duchy | 2 | 30 | 6 | 2.1 | 6.9 | 0.0 | 0.0 | -3 | 4.0 | +5 | 1.0 | 3 | 23 | 1.5/18 | 100% | 3.0 | 1.0 | 0/2 | M09 |
| Winter Captain (C) | kalevan kansa | 1 | 24 | 1 | 1.1 | 4.7 | 0.0 | 0.0 | -3 | 1.1 | -4 | 4.0 | 17 | 0 | 0.0/6 | 100% | 1.0 | 5.0 | 1/1 | M05 |
| Cain - The First Penitent (C) | covenant jerusalem | 1 | 75 | 5 | 5.8 | 7.7 | 2.8 | 0.0 | -3 | 5.8 | -6 | 0.0 | 0 | 0 | 0.0/8 | 100% | 3.0 | 3.0 | 1/1 | M24 |
| Rammal Geomancer (C) | caliphate sanctuaries | 2 | 18 | 1 | 0.9 | 5.2 | 0.3 | 0.0 | -3 | 0.9 | -4 | 0.5 | 3 | 0 | 2.0/4 | 50% | 1.0 | 3.0 | 1/2 | M07 M22 |
| Cultist Mortar Squad | infernal congregations | 1 | 12 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -4 | 0.0 | -4 | 0.0 | 0 | 0 | 0.0/5 | 100% | 1.0 | 0.0 | 0/1 | M01 |
| Vishap Harpooners | kingdom hayk | 1 | 25 | 3 | 1.2 | 4.7 | 0.0 | 0.0 | -4 | 1.2 | -4 | 4.0 | 16 | 0 | 0.0/9 | 100% | 5.0 | 0.0 | 0/1 | M10 |
| Sugaar Gun | euskal herria | 1 | 35 | 0 | 2.0 | 5.7 | 0.0 | 0.0 | -4 | 2.8 | -2 | 25.0 | 71 | 38 | 0.0/7 | 100% | 0.0 | 0.0 | 0/1 | M11 |
| Grey Huskarls | runeforge directorate | 2 | 25 | 3 | 1.5 | 6.0 | 1.5 | 1.0 | -4 | 1.5 | -5 | 4.0 | 16 | 0 | 2.5/6 | 50% | 0.0 | 2.0 | 2/2 | M02 M12 |
| Lucent Exemplars | infernal congregations | 1 | 30 | 6 | 1.5 | 5.0 | 1.0 | 0.0 | -4 | 4.2 | +4 | 0.0 | 0 | 41 | 6.0/6 | 0% | 2.0 | 2.0 | 0/1 | M23 |
| Kharakternyk (C) | great cossack | 1 | 22 | 1 | 0.8 | 3.5 | 0.7 | 0.0 | -4 | 0.8 | -5 | 0.0 | 0 | 0 | 5.0/5 | 0% | 1.0 | 1.0 | 0/1 | M15 |
| Tide Captain (C) | infernal congregations | 1 | 30 | 3 | 1.4 | 4.8 | 0.0 | 0.0 | -4 | 1.4 | -5 | 0.0 | 0 | 0 | 0.0/7 | 100% | 3.0 | 0.0 | 0/1 | M12 |
| Jordanite Hospitallers | covenant jerusalem | 3 | 15 | 3 | 0.7 | 4.4 | 0.7 | 0.7 | -4 | 0.7 | -5 | 0.3 | 2 | 0 | 9.0/9 | 0% | 1.7 | 0.7 | 1/3 | M22 M24 |
| War Onmyoji (C) | empire nihon | 1 | 20 | 1 | 0.5 | 2.5 | 0.5 | 0.0 | -4 | 0.5 | -5 | 0.0 | 0 | 0 | 3.0/4 | 0% | 1.0 | 3.0 | 0/1 | M18 |
| Runesmith (C) | runeforge directorate | 2 | 15 | 1 | 0.5 | 3.3 | 0.0 | 0.0 | -4 | 0.5 | -5 | 1.5 | 10 | 0 | 0.0/4 | 100% | 2.0 | 0.5 | 2/2 | M02 M12 |
| Chiron Battle Tank | iron imperium | 2 | 40 | 2 | 2.8 | 6.9 | 2.0 | 2.0 | -4 | 2.8 | -6 | 5.0 | 13 | 0 | 2.0/10 | 100% | 2.0 | 2.0 | 0/2 | M02 |
| Tietaja (C) | kalevan kansa | 1 | 15 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -4 | 0.0 | -5 | 0.0 | 0 | 0 | 0.0/4 | 100% | 5.0 | 0.0 | 1/1 | M05 |
| Wildling Acolytes | church beast | 1 | 15 | 10 | 0.0 | 0.0 | 0.0 | 0.0 | -4 | 0.0 | -5 | 8.0 | 53 | 0 | 24.0/30 | 100% | 1.0 | 4.0 | 1/1 | M07 |
| Petard Bearer (C) | covenant jerusalem | 1 | 15 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -4 | 0.0 | -5 | 0.0 | 0 | 0 | 0.0/5 | 100% | 4.0 | 1.0 | 0/1 | M21 |
| Myrrhbearer Sisters | covenant jerusalem | 1 | 35 | 5 | 1.8 | 5.2 | 1.8 | 3.0 | -4 | 1.8 | -5 | 18.0 | 51 | 0 | 4.0/10 | 100% | 1.0 | 3.0 | 1/1 | M03 |
| Skeletal Spearman | duat dominion | 3 (1a) | 8 | 10 | 0.0 | 0.0 | 0.0 | 0.0 | -4 | 0.0 | -5 | 0.0 | 0 | 0 | 6.3/10 | 67% | 1.3 | 1.7 | 0/3 | M16 |
| Prydain Field Gun | british liberation | 1 | 27 | 1 | 1.1 | 3.9 | 0.0 | 0.0 | -4 | 1.1 | -5 | 0.0 | 0 | 0 | 0.0/6 | 100% | 3.0 | 0.0 | 1/1 | M04 |
| Taichou (C) | empire nihon | 1 | 32 | 1 | 1.5 | 4.7 | 0.5 | 0.0 | -5 | 2.6 | -2 | 8.0 | 25 | 25 | 5.0/6 | 100% | 2.0 | 6.0 | 0/1 | M18 |
| Mobad (C) | atashid empire | 2 | 20 | 1 | 0.9 | 4.5 | 0.9 | 0.0 | -5 | 0.9 | -5 | 3.0 | 15 | 0 | 2.0/4 | 50% | 1.0 | 1.0 | 2/2 | M01 M21 |
| Sphinx Construct | duat dominion | 1 | 45 | 3 | 2.7 | 5.9 | 2.7 | 0.0 | -5 | 2.7 | -6 | 0.0 | 0 | 0 | 0.0/14 | 100% | 3.0 | 3.0 | 0/1 | M16 |
| Ikarus Skirmishers | panhellenic league | 1 | 16 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -5 | 0.0 | -5 | 0.0 | 0 | 0 | 6.0/6 | 0% | 1.0 | 2.0 | 1/1 | M13 |
| Master Gunner (C) | covenant jerusalem | 1 | 20 | 1 | 0.3 | 1.7 | 0.0 | 0.0 | -5 | 0.3 | -5 | 4.0 | 20 | 0 | 0.0/5 | 100% | 1.0 | 0.0 | 0/1 | M21 |
| Centurion (C) | iron imperium | 1 | 22 | 1 | 0.5 | 2.3 | 0.0 | 0.0 | -5 | 0.5 | -5 | 3.0 | 14 | 0 | 0.0/6 | 100% | 1.0 | 1.0 | 0/1 | M02 |
| Speculatores | iron imperium | 2 | 18 | 3 | 0.7 | 3.7 | 0.0 | 0.0 | -5 | 0.7 | -6 | 0.0 | 0 | 0 | 3.0/6 | 50% | 1.5 | 0.0 | 2/2 | M08 M20 |
| The Plague Monarch (C) | infernal congregations | 1 | 70 | 4 | 4.8 | 6.9 | 4.8 | 3.0 | -5 | 4.8 | -7 | 0.0 | 0 | 0 | 0.0/14 | 100% | 2.0 | 5.0 | 1/1 | M11 |
| Augur (C) | iron imperium | 2 | 22 | 1 | 1.0 | 4.5 | 1.0 | 0.0 | -5 | 1.0 | -6 | 0.0 | 0 | 0 | 2.0/4 | 50% | 1.0 | 1.0 | 1/2 | M02 M08 |
| Etxe Riflemen | euskal herria | 4 (1a) | 15 | 10 | 0.6 | 4.2 | 0.6 | 0.8 | -5 | 0.6 | -6 | 9.5 | 63 | 0 | 12.3/20 | 75% | 1.8 | 0.5 | 0/4 | M11 |
| Knight-Bulwarks | british liberation | 1 | 41 | 9 | 2.1 | 5.2 | 1.5 | 0.0 | -5 | 2.1 | -6 | 6.0 | 15 | 0 | 10.0/12 | 0% | 1.0 | 1.0 | 1/1 | M04 |
| Poxknight | infernal congregations | 1 | 38 | 10 | 1.9 | 4.9 | 1.8 | 0.0 | -5 | 1.9 | -6 | 8.0 | 21 | 0 | 16.0/15 | 0% | 4.0 | 4.0 | 1/1 | M11 |
| Evil-Eye Serpent | infernal congregations | 1 | 52 | 2 | 3.1 | 6.0 | 0.0 | 0.0 | -5 | 3.1 | -7 | 6.0 | 12 | 0 | 2.0/14 | 100% | 1.0 | 1.0 | 0/1 | M12 |
| Algedonic Taskmaster (C) | infernal congregations | 1 | 18 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -5 | 0.0 | -6 | 0.0 | 0 | 0 | 0.0/7 | 100% | 3.0 | 0.0 | 0/1 | M01 |
| Erankavijat Recons | kalevan kansa | 1 | 18 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -5 | 0.0 | -6 | 6.0 | 33 | 0 | 6.0/6 | 0% | 0.0 | 0.0 | 1/1 | M05 |
| Mikelete Marksmen | euskal herria | 1 | 18 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -5 | 0.0 | -6 | 0.0 | 0 | 0 | 6.0/6 | 0% | 1.0 | 0.0 | 0/1 | M11 |
| Kuban Plastuns | great cossack | 1 (1a) | 18 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -5 | 0.0 | -6 | 0.0 | 0 | 0 | 6.0/6 | 0% | 0.0 | 0.0 | 0/1 | M15 |
| Naqib (C) | caliphate sanctuaries | 2 | 29 | 1 | 1.5 | 5.3 | 1.0 | 0.0 | -5 | 2.3 | -3 | 4.5 | 16 | 8 | 0.0/6 | 100% | 2.5 | 2.5 | 2/2 | M22 |
| Retiarius Squad | iron imperium | 1 | 24 | 3 | 0.5 | 2.1 | 0.0 | 0.0 | -5 | 0.5 | -6 | 0.0 | 0 | 0 | 15.0/15 | 0% | 0.0 | 1.0 | 0/1 | M03 |
| Host Sotnia | great cossack | 3 | 20 | 5 | 0.9 | 4.6 | 0.9 | 0.7 | -5 | 0.9 | -6 | 1.7 | 8 | 0 | 15.0/15 | 0% | 1.0 | 0.7 | 0/3 | M15 |
| Winter Witch (C) | principality novgorod | 1 | 30 | 1 | 1.0 | 3.3 | 0.0 | 0.0 | -6 | 1.5 | -5 | 11.0 | 37 | 25 | 5.0/5 | 0% | 0.0 | 1.0 | 0/1 | M17 |
| Hephaestian Tripod | panhellenic league | 1 | 20 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -6 | 0.0 | -6 | 0.0 | 0 | 0 | 0.0/6 | 100% | 3.0 | 0.0 | 1/1 | M13 |
| Floodgate Sappers | mat akkadi | 1 | 20 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -6 | 0.0 | -6 | 0.0 | 0 | 0 | 6.0/6 | 0% | 1.0 | 0.0 | 0/1 | M14 |
| Sidhe Druid (C) | grand duchy | 2 | 18 | 1 | 0.5 | 2.5 | 0.0 | 0.0 | -6 | 0.5 | -7 | 0.0 | 0 | 0 | 0.0/3 | 100% | 1.5 | 2.0 | 1/2 | M09 M10 |
| The Veiled Queen (C) | infernal congregations | 1 | 70 | 4 | 4.5 | 6.5 | 4.3 | 3.0 | -6 | 4.5 | -8 | 0.0 | 0 | 0 | 0.0/9 | 100% | 6.0 | 5.0 | 1/1 | M14 |
| Five-Banner Marshal (C) | jade mandate | 1 | 24 | 1 | 0.3 | 1.3 | 0.0 | 0.0 | -6 | 2.3 | -1 | 3.0 | 13 | 30 | 6.0/6 | 0% | 1.0 | 0.0 | 1/1 | M23 |
| Artificer-Captain (C) | iron imperium | 1 | 28 | 1 | 0.7 | 2.4 | 0.0 | 0.0 | -6 | 0.7 | -7 | 4.0 | 14 | 0 | 0.0/6 | 100% | 2.0 | 1.0 | 0/1 | M04 |
| Tadeusz Kosciuszko (C) | polish lithuanian | 1 | 65 | 5 | 4.0 | 6.2 | 1.5 | 0.0 | -6 | 4.0 | -8 | 0.0 | 0 | 0 | 3.0/8 | 0% | 1.0 | 2.0 | 0/1 | M06 |
| Andranik Ozanian (C) | kingdom hayk | 1 | 55 | 3 | 3.1 | 5.6 | 1.5 | 0.0 | -6 | 3.1 | -8 | 0.0 | 0 | 0 | 5.0/7 | 100% | 3.0 | 3.0 | 0/1 | M10 |
| Archistrategos (C) | covenant jerusalem | 2 | 60 | 3 | 4.2 | 6.9 | 1.0 | 1.5 | -6 | 5.4 | -4 | 7.5 | 13 | 19 | 1.0/10 | 100% | 1.5 | 1.5 | 1/2 | M06 M21 |
| Pahak Riflemen | kingdom hayk | 5 (2a) | 16 | 10 | 0.6 | 3.7 | 0.2 | 0.0 | -6 | 0.8 | -6 | 1.6 | 10 | 3 | 18.2/20 | 40% | 1.2 | 0.6 | 0/5 | M10 |
| Fomorian Tidebreaker | grand duchy | 1 | 55 | 2 | 3.0 | 5.5 | 0.0 | 0.0 | -6 | 3.0 | -8 | 6.0 | 11 | 0 | 12.0/15 | 0% | 0.0 | 2.0 | 1/1 | M17 |
| Foral Captain (C) | euskal herria | 1 | 22 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -6 | 0.0 | -7 | 0.0 | 0 | 0 | 0.0/6 | 100% | 3.0 | 0.0 | 0/1 | M11 |
| Lector (C) | infernal congregations | 1 | 22 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -6 | 0.0 | -7 | 2.0 | 9 | 0 | 6.0/6 | 0% | 1.0 | 1.0 | 1/1 | M14 |
| Saint-Militant (C) | covenant jerusalem | 2 | 50 | 3 | 3.2 | 6.5 | 1.5 | 1.0 | -7 | 3.7 | -7 | 11.0 | 22 | 10 | 0.5/7 | 100% | 2.0 | 3.0 | 2/2 | M03 M15 |
| The Blooded Hegemon (C) | infernal congregations | 1 | 70 | 3 | 4.3 | 6.2 | 3.0 | 3.0 | -7 | 5.2 | -6 | 6.0 | 9 | 40 | 4.0/8 | 100% | 4.0 | 3.0 | 1/1 | M18 |
| Vainamoinen (C) | kalevan kansa | 1 | 70 | 4 | 4.3 | 6.1 | 2.0 | 2.0 | -7 | 6.3 | -3 | 6.0 | 9 | 30 | 0.0/8 | 100% | 1.0 | 4.0 | 1/1 | M05 |
| Briarean Ferricants | iron imperium | 1 | 30 | 3 | 0.7 | 2.2 | 0.0 | 0.0 | -7 | 0.7 | -7 | 16.0 | 53 | 0 | 0.0/9 | 100% | 2.0 | 1.0 | 0/1 | M04 |
| Khassakiyya Guard | caliphate sanctuaries | 2 | 45 | 3 | 2.8 | 6.1 | 0.5 | 0.0 | -7 | 2.8 | -9 | 8.5 | 19 | 0 | 5.0/15 | 100% | 1.5 | 2.0 | 0/2 | M19 |
| Host Osaul (C) | great cossack | 1 | 23 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -7 | 0.0 | -7 | 2.0 | 9 | 0 | 6.0/6 | 0% | 1.0 | 0.0 | 0/1 | M15 |
| Palatine Protospatharius (C) | iron imperium | 1 | 40 | 2 | 1.5 | 3.8 | 0.8 | 0.0 | -7 | 1.5 | -8 | 1.0 | 3 | 0 | 0.0/8 | 100% | 2.0 | 3.0 | 0/1 | M13 |
| Legionnaire Squad | iron imperium | 11 (4a) | 20 | 10 | 1.0 | 5.2 | 0.5 | 0.2 | -7 | 1.1 | -8 | 3.7 | 19 | 2 | 7.5/10 | 36% | 0.8 | 0.6 | 5/11 | M02 M03 M04 M08 M20 M24 |
| Archistrategos (Mounted) (C) | covenant jerusalem | 1 | 70 | 3 | 4.2 | 6.0 | 3.5 | 6.0 | -7 | 4.2 | -9 | 2.0 | 3 | 0 | 0.0/12 | 100% | 3.0 | 4.0 | 1/1 | M19 |
| Ushkuynik Marines | principality novgorod | 1 | 30 | 5 | 0.5 | 1.8 | 0.6 | 0.0 | -7 | 0.5 | -8 | 2.0 | 7 | 0 | 10.0/10 | 0% | 1.0 | 2.0 | 0/1 | M05 |
| Equites Igniferi | iron imperium | 1 | 25 | 5 | 0.0 | 0.0 | 0.0 | 0.0 | -7 | 0.0 | -8 | 0.0 | 0 | 0 | 0.0/20 | 100% | 4.0 | 0.0 | 0/1 | M02 |
| Queen Consort (C) | infernal congregations | 1 | 25 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -7 | 0.0 | -8 | 0.0 | 0 | 0 | 0.0/6 | 100% | 1.0 | 0.0 | 1/1 | M14 |
| Firelance Druzhina | principality novgorod | 1 | 25 | 5 | 0.0 | 0.0 | 0.0 | 0.0 | -7 | 0.0 | -8 | 8.0 | 32 | 0 | 10.0/10 | 0% | 1.0 | 1.0 | 0/1 | M17 |
| The Pontifex of Acedia (C) | infernal congregations | 1 | 75 | 3 | 4.5 | 6.0 | 1.0 | 2.0 | -7 | 4.5 | -10 | 3.0 | 4 | 0 | 6.0/15 | 100% | 1.0 | 4.0 | 0/1 | M01 |
| Rapacious Crusader | infernal congregations | 3 | 30 | 6 | 1.5 | 5.0 | 1.3 | 0.0 | -7 | 2.2 | -5 | 5.3 | 18 | 7 | 4.3/6 | 0% | 2.3 | 1.3 | 0/3 | M08 |
| Isfahsalar (C) | caliphate sanctuaries | 1 | 60 | 3 | 3.0 | 5.0 | 0.0 | 0.0 | -8 | 3.0 | -10 | 4.0 | 7 | 0 | 0.0/10 | 100% | 3.0 | 3.0 | 0/1 | M19 |
| Koscheyan Troopers | principality novgorod | 2 | 40 | 5 | 2.0 | 5.1 | 1.6 | 3.0 | -8 | 2.0 | -10 | 12.5 | 31 | 0 | 10.5/15 | 50% | 1.5 | 3.0 | 0/2 | M05 |
| Valkyrie (C) | runeforge directorate | 1 | 50 | 2 | 2.0 | 4.0 | 0.5 | 0.0 | -8 | 2.5 | -8 | 2.0 | 4 | 10 | 0.0/6 | 100% | 1.0 | 4.0 | 1/1 | M12 |
| Legatus (C) | iron imperium | 1 | 50 | 1 | 2.0 | 4.0 | 2.0 | 0.0 | -8 | 2.0 | -10 | 0.0 | 0 | 0 | 0.0/6 | 100% | 6.0 | 2.0 | 1/1 | M08 |
| Palatine Custos | iron imperium | 2 | 70 | 3 | 4.7 | 6.7 | 2.5 | 3.0 | -8 | 4.7 | -12 | 0.0 | 0 | 0 | 1.0/12 | 100% | 4.0 | 3.0 | 0/2 | M13 |
| Merlin - Wizard of Avalon (C) | british liberation | 1 | 70 | 4 | 3.6 | 5.2 | 3.5 | 0.0 | -9 | 3.6 | -11 | 6.0 | 9 | 0 | 0.0/8 | 100% | 0.0 | 5.0 | 1/1 | M09 |
| Staurotheke War-Shrine | covenant jerusalem | 2 | 30 | 2 | 1.0 | 3.2 | 0.5 | 0.0 | -9 | 1.0 | -10 | 0.0 | 0 | 0 | 1.5/8 | 100% | 4.5 | 0.5 | 1/2 | M06 M22 |
| Somniferous Engine | infernal congregations | 1 | 30 | 0 | 0.0 | 0.0 | 0.0 | 0.0 | -9 | 0.0 | -10 | 0.0 | 0 | 0 | 0.0/12 | 100% | 4.0 | 0.0 | 0/1 | M01 |
| Ukko Thunder-Sledge | kalevan kansa | 1 | 30 | 0 | 0.0 | 0.0 | 0.0 | 0.0 | -9 | 0.0 | -10 | 27.0 | 90 | 0 | 0.0/7 | 100% | 0.0 | 0.0 | 1/1 | M05 |
| Zamburak Camel-Artillery | caliphate sanctuaries | 1 | 30 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -9 | 0.0 | -10 | 4.0 | 13 | 0 | 12.0/12 | 0% | 0.0 | 0.0 | 0/1 | M07 |
| Earthshaker Mortar | iron imperium | 1 | 30 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -9 | 0.0 | -10 | 23.0 | 77 | 0 | 0.0/6 | 100% | 1.0 | 0.0 | 1/1 | M08 |
| Enceladan Ferricants | iron imperium | 1 | 38 | 3 | 0.7 | 1.8 | 0.0 | 0.0 | -9 | 0.7 | -10 | 0.0 | 0 | 0 | 0.0/9 | 100% | 2.0 | 1.0 | 0/1 | M04 |
| Sniper Hesychast (C) | covenant jerusalem | 2 | 20 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -9 | 0.0 | -10 | 2.0 | 10 | 0 | 0.0/5 | 100% | 3.5 | 0.5 | 0/2 | M20 |
| Saladin - Al-Malik al-Nasir (C) | caliphate sanctuaries | 1 | 75 | 4 | 4.0 | 5.3 | 2.0 | 3.0 | -9 | 4.0 | -11 | 21.0 | 28 | 0 | 0.0/9 | 100% | 1.0 | 4.0 | 0/1 | M07 |
| Knight-Constable (C) | british liberation | 1 | 60 | 3 | 2.6 | 4.3 | 1.5 | 0.0 | -9 | 2.6 | -11 | 5.0 | 8 | 0 | 0.0/9 | 100% | 2.0 | 2.0 | 1/1 | M04 |
| Terek Shashka Riders | great cossack | 2 | 35 | 5 | 1.2 | 3.4 | 1.1 | 0.0 | -10 | 1.2 | -11 | 11.0 | 31 | 0 | 17.0/20 | 50% | 2.0 | 2.0 | 0/2 | M15 |
| T.A.L.O.S Warcolossus | iron imperium | 1 | 60 | 2 | 2.3 | 3.9 | 1.0 | 0.0 | -10 | 2.9 | -10 | 8.0 | 13 | 13 | 8.0/16 | 100% | 1.0 | 3.0 | 0/1 | M04 |
| Comitatus Armored Carrier | iron imperium | 1 | 35 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -10 | 0.0 | -11 | 6.0 | 17 | 0 | 2.0/10 | 100% | 1.0 | 0.0 | 0/1 | M03 |
| Firelake Warden | duat dominion | 1 | 35 | 2 | 0.0 | 0.0 | 0.0 | 0.0 | -10 | 0.0 | -11 | 15.0 | 43 | 0 | 8.0/8 | 0% | 1.0 | 0.0 | 0/1 | M16 |
| Tsuchigumo Gun Battery | empire nihon | 1 | 35 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -10 | 0.0 | -11 | 10.0 | 29 | 0 | 8.0/8 | 0% | 0.0 | 0.0 | 0/1 | M18 |
| Masque of Carnality (C) | infernal congregations | 1 | 55 | 1 | 1.8 | 3.2 | 0.8 | 0.0 | -10 | 1.8 | -12 | 1.0 | 2 | 0 | 0.0/6 | 100% | 4.0 | 4.0 | 1/1 | M14 |
| Blackflint Archers | grand duchy | 2 | 30 | 5 | 0.6 | 2.1 | 0.5 | 0.0 | -11 | 0.6 | -11 | 20.0 | 67 | 0 | 3.5/5 | 50% | 0.0 | 0.5 | 1/2 | M09 M10 |
| White Pole Guard | jade mandate | 1 | 41 | 6 | 0.3 | 0.8 | 0.0 | 0.0 | -11 | 0.3 | -12 | 0.0 | 0 | 0 | 9.0/9 | 0% | 2.0 | 0.0 | 1/1 | M23 |
| Herald of Feral Affliction (C) | church beast | 1 | 60 | 3 | 2.0 | 3.3 | 2.0 | 6.0 | -11 | 2.0 | -13 | 5.0 | 8 | 0 | 4.0/10 | 100% | 1.0 | 4.0 | 1/1 | M07 |
| Consecrated Hussars | polish lithuanian | 2 | 43 | 3 | 1.6 | 3.7 | 0.3 | 0.0 | -12 | 2.0 | -11 | 4.5 | 10 | 10 | 5.0/12 | 100% | 1.5 | 1.0 | 0/2 | M06 |
| Bogatyr Thunderguards | principality novgorod | 1 | 40 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -12 | 0.0 | -13 | 4.0 | 10 | 0 | 12.0/12 | 0% | 0.0 | 0.0 | 0/1 | M17 |
| Artificer-General (C) | iron imperium | 1 | 55 | 1 | 1.3 | 2.4 | 1.0 | 0.0 | -12 | 2.2 | -11 | 3.0 | 5 | 41 | 0.0/7 | 100% | 2.0 | 2.0 | 0/1 | M04 |
| Knight of Tehom | infernal congregations | 2 | 34 | 10 | 0.7 | 2.1 | 0.0 | 0.0 | -12 | 0.7 | -13 | 1.5 | 4 | 0 | 6.0/15 | 50% | 1.0 | 0.5 | 0/2 | M12 |
| Silver Arrow Brethren | covenant jerusalem | 2 | 35 | 5 | 0.8 | 2.1 | 0.5 | 1.0 | -12 | 0.8 | -13 | 6.0 | 17 | 0 | 6.5/10 | 50% | 0.0 | 1.0 | 0/2 | M20 |
| Nicomedean Thunder Tower | covenant jerusalem | 1 | 45 | 2 | 0.3 | 0.7 | 0.0 | 0.0 | -12 | 0.3 | -13 | 3.0 | 7 | 0 | 3.0/12 | 100% | 1.0 | 0.0 | 0/1 | M21 |
| Ardashir - The Flamebringer (C) | atashid empire | 1 | 75 | 5 | 3.0 | 4.0 | 2.5 | 3.0 | -12 | 3.0 | -14 | 0.0 | 0 | 0 | 0.0/10 | 100% | 2.0 | 3.0 | 1/1 | M21 |
| Waymarshal (C) | grand duchy | 1 | 50 | 2 | 0.7 | 1.5 | 0.0 | 0.0 | -12 | 0.7 | -14 | 5.0 | 10 | 0 | 4.0/6 | 100% | 1.0 | 4.0 | 0/1 | M09 |
| Carpet-Bomber | caliphate sanctuaries | 2 | 30 | 0 | 0.3 | 0.8 | 0.3 | 0.0 | -12 | 0.3 | -13 | 4.5 | 15 | 0 | 4.0/9 | 100% | 3.0 | 5.0 | 2/2 | M22 |
| Rurik the Deathless (C) | principality novgorod | 1 | 70 | 4 | 2.3 | 3.3 | 2.0 | 0.0 | -13 | 2.7 | -14 | 6.0 | 9 | 15 | 0.0/12 | 100% | 1.0 | 2.0 | 0/1 | M17 |
| Leshen Besieger | principality novgorod | 1 | 45 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -13 | 0.0 | -14 | 6.0 | 13 | 0 | 0.0/12 | 100% | 4.0 | 0.0 | 0/1 | M05 |
| Knight-Scourgers | british liberation | 1 | 45 | 6 | 0.0 | 0.0 | 0.0 | 0.0 | -13 | 0.0 | -14 | 1.0 | 2 | 0 | 12.0/12 | 0% | 1.0 | 0.0 | 1/1 | M09 |
| Seraphic Justiciar (C) | covenant jerusalem | 2 | 35 | 3 | 0.5 | 1.4 | 0.5 | 0.0 | -13 | 0.5 | -14 | 0.0 | 0 | 0 | 0.0/10 | 100% | 3.0 | 3.0 | 2/2 | M15 |
| Vermillion Rocket Battery | jade mandate | 2 | 30 | 1 | 0.0 | 0.0 | 0.0 | 0.0 | -14 | 0.5 | -12 | 16.5 | 55 | 5 | 0.0/5 | 100% | 0.0 | 0.0 | 2/2 | M23 |
| The Chairman of the Chamber (C) | infernal congregations | 1 | 70 | 3 | 2.0 | 2.9 | 2.0 | 0.0 | -14 | 2.0 | -16 | 4.0 | 6 | 0 | 4.0/12 | 100% | 2.0 | 2.0 | 0/1 | M08 |
| Bounded Ifrit | caliphate sanctuaries | 1 | 50 | 2 | 0.0 | 0.0 | 0.0 | 0.0 | -15 | 0.0 | -16 | 3.0 | 6 | 0 | 6.0/9 | 100% | 3.0 | 0.0 | 0/1 | M07 |
| The High Admiral (C) | infernal congregations | 1 | 70 | 4 | 1.8 | 2.5 | 0.0 | 0.0 | -15 | 1.8 | -17 | 5.0 | 7 | 0 | 2.0/10 | 100% | 1.0 | 2.0 | 0/1 | M12 |
| Golgothic Paladins | covenant jerusalem | 2 | 60 | 6 | 2.4 | 4.0 | 2.4 | 1.5 | -15 | 7.4 | +6 | 24.5 | 41 | 76 | 1.0/15 | 100% | 1.5 | 4.0 | 2/2 | M06 M24 |
| Gilgamesh (C) | mat akkadi | 1 | 75 | 5 | 2.0 | 2.7 | 2.0 | 2.0 | -16 | 2.0 | -18 | 0.0 | 0 | 0 | 0.0/10 | 100% | 4.0 | 3.0 | 0/1 | M14 |
| Praetorian Fireteam | iron imperium | 2 | 35 | 6 | 0.0 | 0.0 | 0.0 | 0.0 | -16 | 0.0 | -17 | 2.0 | 6 | 0 | 7.5/9 | 0% | 1.0 | 0.0 | 0/2 | M02 M24 |
| Otto of Saxony (C) | runeforge directorate | 1 | 70 | 3 | 1.3 | 1.9 | 1.0 | 0.0 | -16 | 2.2 | -15 | 5.0 | 7 | 20 | 0.0/10 | 100% | 3.0 | 1.0 | 1/1 | M02 |
| Ivan Sirko (Mounted) (C) | great cossack | 1 | 75 | 4 | 1.6 | 2.1 | 1.5 | 0.0 | -17 | 1.6 | -19 | 10.0 | 13 | 0 | 2.0/9 | 100% | 1.0 | 2.0 | 0/1 | M15 |
| Saladin - Al-Malik al-Nasir (Mounted) (C) | caliphate sanctuaries | 1 | 85 | 4 | 2.5 | 2.9 | 1.0 | 0.0 | -17 | 3.2 | -17 | 10.0 | 12 | 10 | 0.0/9 | 100% | 1.0 | 1.0 | 0/1 | M19 |
| St. Barbara Field Gun | covenant jerusalem | 5 | 26 | 1 | 0.1 | 0.3 | 0.0 | 0.0 | -17 | 0.1 | -18 | 2.4 | 9 | 0 | 2.0/5 | 60% | 1.4 | 0.0 | 0/5 | M20 M21 M22 |
| Tomas Zumalakarregi (C) | euskal herria | 1 | 65 | 3 | 0.5 | 0.8 | 0.5 | 0.0 | -17 | 0.5 | -19 | 0.0 | 0 | 0 | 2.0/7 | 100% | 4.0 | 2.0 | 0/1 | M11 |
| The Dawn King (C) | infernal congregations | 1 | 70 | 4 | 0.8 | 1.1 | 0.0 | 0.0 | -18 | 1.2 | -18 | 17.0 | 24 | 10 | 5.0/10 | 100% | 1.0 | 5.0 | 0/1 | M23 |
| Morphean Engine | infernal congregations | 2 | 40 | 3 | 0.0 | 0.0 | 0.0 | 0.0 | -18 | 0.9 | -15 | 12.0 | 30 | 9 | 0.0/10 | 100% | 0.5 | 0.0 | 0/2 | M01 |
| Caesar - Divus Imperator (Mounted) (C) | iron imperium | 1 | 85 | 5 | 1.8 | 2.2 | 0.0 | 0.0 | -19 | 1.8 | -21 | 12.0 | 14 | 0 | 0.0/10 | 100% | 1.0 | 3.0 | 0/1 | M03 |
| Ramesses, the Eternal Pharaoh (C) | duat dominion | 1 | 75 | 5 | 0.0 | 0.0 | 0.0 | 0.0 | -22 | 0.0 | -24 | 8.0 | 11 | 0 | 0.0/10 | 100% | 1.0 | 1.0 | 0/1 | M16 |
| Palatine Custos (Mounted) | iron imperium | 1 | 80 | 3 | 0.3 | 0.4 | 0.0 | 0.0 | -22 | 0.3 | -24 | 0.0 | 0 | 0 | 19.0/18 | 0% | 2.0 | 1.0 | 0/1 | M03 |
