# Champion League: which map?

The user asked: "not sure if CROSSROADS is a good map for this tournament. What do you think? I want something that strikes the balance between range and melee."

## Short answer

- **CROSSROADS is not what made Day 1 lean melee.** In batches where the same matchup was played on several maps under the same code, ACROPOLIS and TRIPLE HILLS come out within 1 point of CROSSROADS on melee's share of damage. They are +0.3 and +0.7 points, over 24 and 21 batches.
  - CROSSROADS itself produced 41% melee damage in the Oct 27+ records (97 battles). On Day 1 it produced 49%.
  - So the Day 1 lean comes from that field of armies and from the rules: Overwatch hits only on a natural 6, and ranged fire is weak against DEF 2+ TOUGH targets (`balance.md`). The map is not the cause.
- **Only TWIN LAKES visibly moves the split, and it moves it toward ranged.** On TWIN LAKES, ranged plus Overwatch did 59% of the damage and 60% of the kills; melee did 34% of each. That is only 15 battles, all from Oct 27 morning code. The board shape agrees: TWIN LAKES is the most exposed board by a wide margin.
- **CROSSROADS' real weakness is that it has no elevation.** Euskal Herria's identity and its Adur Mana, Zumalakarregi's Unconquerable Mountaineer, and Albion's Stone flow all need ELEVATION 1+, and CROSSROADS has none. Its strengths: it has the most testing (220 records), the closest games (median margin 16 VP, against 19-23 on the other maps), and it mirrors on both axes.
- **The map does change who wins, even when it leaves the aggregate split alone.** Longwu Army played 22 battles on each of three maps against the same four opponents. It went 18-4 on TRIPLE HILLS, 13-9 on CROSSROADS and 9-13 on ACROPOLIS.
- **Recommendation: rotate the maps by matchday** (CROSSROADS, ACROPOLIS, TRIPLE HILLS) and keep Day 1 as a CROSSROADS day.
  - Every army plays exactly one battle per day, so a per-day rotation gives all 48 armies the same set of maps.
  - It turns on the elevation factions for 5 of the 8 days.
  - It spreads out the map-specific swings rather than building one map's bias into the table.
  - The knockout should stay on CROSSROADS, or rotate the maps game by game within each best-of-3.
  - Add TWIN LAKES only if you want to deliberately tilt toward ranged, and run a batch on current code first.

## 1. The maps

Skirmish has exactly four maps, all 15x15 and all under `data/maps/medium/`:

- `acropolis.json`
- `crossroads.json`
- `triple_hills.json`
- `twin_lakes.json`

The other 20 files are `naval_invasion_*`, and every one carries `"campaignOnly": true`. Note that `data/editions/fantasy/maps/` holds only a `.gitkeep`.

All four maps mirror left-right and top-bottom; I checked this on the grid and the elevation together. All league records use Seize the Ground with the **Central Faceoff** deployment (`data/maps/deployments/medium/central_faceoff.json`):

- **Zones:** A has cols 3-11, rows 12-14; B has cols 3-11, rows 0-2.
- **Gap:** the zone fronts are 10 squares apart, and an infantry unit needs 10 MP to walk from one front to the other on every map.
- **Objectives:** `[7,7,3]`, `[1,7,2]`, `[13,7,2]`, meaning the centre is worth 3 VP and the flanks 2 VP each.
- **Objective Area:** the marker's square plus the 8 squares around it (`objectives.js`: Chebyshev ≤ 1).
- **Other deployments:** TRIPLE HILLS lists only `central_faceoff` in `stg_deployments`. The other three maps also support `cross_fire`.

How terrain works (`data/terrain/types/*.json` and the mechanics deep-dive):

- **FOREST and RUINS:** `blocks_los`, LIGHT cover, concealment. LARGE, TOWERING and VEHICLE units pay +1 MP to enter.
- **URBAN:** the same, but HEAVY cover.
- **ROCKY:** +1 MP for every unit.
- **MARSH:** INFANTRY pay +1 MP and suffer −1 HIT.
- **WATER:** impassable.
- **Cover and concealment** apply to ranged attacks only.
- **Elevation:** adds its level, up to 2, to weapon range and PER (`getElevationBonus`). Climbing costs +1 MP per level, and a unit cannot climb two levels in one step. A LOS blocker stops a line only when it stands at least as high as the higher end of the line. Raised ground blocks the view past its edge (`los_heights.js`).

### Terrain counts (225 squares each)

| | ACROPOLIS | CROSSROADS | TRIPLE HILLS | TWIN LAKES |
|---|---|---|---|---|
| terrain mix | open 173, forest 28, ruins 14, rocky 10 | open 181, urban 16, ruins 16, forest 12 | open 157, forest 36, urban 24, ruins 8 | open 155, water 30, ruins 16, forest 12, marsh 12 |
| block LOS | 42 (19%) | 44 (20%) | **68 (30%)** | 28 (12%) |
| cover (LIGHT / HEAVY) | 42 / 0 | 28 / 16 | 44 / **24** | 28 / 0 |
| elevation ≥1 / =2 | **25 / 9** | 0 / 0 | **27 / 3** | 0 / 0 |
| slows movement | rocky 10 (all units), plus the climb; 42 slow bulky units | 44 slow bulky units | 68 slow bulky units, plus the climb | marsh 12 (INFANTRY); 28 slow bulky units |
| impassable | 0 | 0 | 0 | **30 (water)** |
| cover in own deployment zone | 0 | 0 | **6 HEAVY (urban)** | 0 |
| clear full-length rows / columns | rows 0,3,11,14 / cols 5,7,9 | rows 0,1,2,**7**,12,13,14 / cols 0,3,**7**,11,14 | row 7 / col 7 | rows 2,4,10,12 / cols 6,7,8 |

### Sightlines into the objectives, and cover on the way in

I measured these with the engine's own sight code, loaded unchanged:

- `board/line_walk.js`
- `board/los_heights.js`
- `board/terrain_def.js`
- `campaign/battle/map_gen/sight.js`

The measure counts terrain and elevation only, with no units and no smoke on the board. "Exposure" means how many of B's 27 deployment-zone squares can see a square within 8. Most weapon ranges are 4-10, and MOVE is mostly 3.

| | ACROPOLIS | CROSSROADS | TRIPLE HILLS | TWIN LAKES |
|---|---|---|---|---|
| centre (7,7): terrain and elevation | open, **elev 2** (summit) | open, elev 0 | open, **elev 2** (hilltop) | open, elev 0 (causeway) |
| squares that see the centre square | **8** (its neighbours only) | 52 | **222** | 166 |
| B-zone squares that see the centre | **0/27** | 5/27 | **27/27** | 27/27 |
| centre-area squares in cover | 6 (ruins) | 0 | 4 (forest corners) | 0 |
| squares that see a flank objective (longest line) | 30 (7) | 64 (13) | 214 (13) | 148 (13) |
| infantry MP from A's zone to the centre area | 6 | 4 | 5 | 4 |
| approach rows 3-11: share hidden from all of B's zone | **50%** | 35% | 41% | **22%** |
| approach rows 3-11: mean exposure | 6.8 | 5.7 | **4.7** | **14.2** |
| least-exposed walk to the centre: mean exposure | 0 | 0 | 0 | **13.5** (1 of 4 squares hidden) |
| least-exposed walk to a flank: mean exposure | 0 | 2.0 | 0 | 4.4 |

What each board does:

- **ACROPOLIS** ("whoever holds the summit looks down on every lane"). The 3 VP summit square is visible only from the 8 squares around it, because the plateau rim blocks every line from below. The fight for it is close combat on the summit.
  - The flank objectives are open, but forest screens them from the deployment zones: each is seen from 1 of B's 27 zone squares.
  - Rocky flanks make the ramp in front of each army the cheap way up, and the summit costs 6 MP to reach.
  - Rim squares are gun platforms, with +1 or +2 range and a view over ground-level blockers.
- **CROSSROADS** ("the two streets that cross it are the longest clear lines on the field"). Row 7 and column 7 are clear from edge to edge, and all three objectives sit on row 7 in the open with no cover anywhere in their areas.
  - The four town blocks (8 urban and 8 ruins squares each side) give melee a hidden road: the least-exposed walk to the centre is 6 squares long, all hidden, 3 of them in cover.
  - This is the middle case on both axes.
- **TRIPLE HILLS**. Every objective square is a hilltop at elevation 2, and nothing else on the board is higher than 1. So each one is seen by all 27 of B's zone squares, and a unit on it sees almost the whole board with +2 range.
  - The approach is the best covered: mean exposure 4.7, and 30% of squares block LOS.
  - Each deployment zone holds 6 HEAVY-cover urban squares.
  - The objectives are fire magnets, while the ground between them is cover.
- **TWIN LAKES** ("water stops a charge but not a bullet"). The centre causeway is seen from all 27 of B's zone squares, no objective area has any cover, and the approach band is more than twice as exposed as on any other map.

## 2. Faction rules that need terrain

I grepped `data/editions/fantasy/factions`, `magic`, `abilities` and `gear` for terrain predicates.

| Rule | Needs | ACRO | CROSS | TRIPLE | TWIN |
|---|---|---|---|---|---|
| Euskal Herria identity: forward deployment (`faction.json`) | a square on ELEVATION 1+ or next to one, ≥2 from the enemy zone, enemy units and every Objective Marker | **40 squares** | **0** | 38 | **0** |
| Euskal identity: reroll ranged HIT 1s; Adur Mana (`magic/euskal_herria/core_system.json`: "INFANTRY unit on a square with ELEVATION 1+ ... gain 1 Mana", max 5 a round) | INFANTRY on ELEVATION 1+ | 25 squares, 16 outside every Objective Area | 0 | 27, **all inside Objective Areas** | 0 |
| Unconquerable Mountaineer (Tomás Zumalakarregi: +1 BS, +1 AP to ranged weapons) | ELEVATION 1+ | yes | no | yes | no |
| Albion Flow of Magic, roll 5 "Stone" (+1 BS) | SIDHE in ROCKY or on elevation 1+ | yes | **no** | yes | **no** |
| Albion roll 3 "Tree" (Mana = SIDHE units in FOREST) | FOREST | 28 squares | 12 | 36 | 12 |
| Albion roll 2 "Water" | WATER / MARSH | no | no | no | **yes** |
| Albion Thornweave Cloaks (HIDDEN in forest: Sidhe Wardens, Draoi); Cad Goddeu (hits enemies in FOREST) | FOREST | 28 | 12 | 36 | 12 |
| Epibatai Marines' Sea Legs (Panhellenic) | WATER | no | no | no | yes |
| Leshen Besieger's Canopy Sight (Novgorod, Opoki Hundred) | FOREST to see through | 28 | 12 | 36 | 12 |
| Brazen Tower: IGNORE TERRAIN DEF; Iron Imperium Dies Irae / Iudicium strip cover | the more cover on the map, the more they are worth | 42 | 44 | **68** | 28 |

Notes:

- **Euskal Herria on Day 1.** Jentilarri (5 Mana) and Kathib (Caliphate) can raise a square to ELEVATION 1, but only once the battle has begun. On Day 1, Oak of Gernika gained **3 Mana all battle** (2 from Weather-Reader, 1 from Channel Mana), so it could never cast Jentilarri. It lost 20-34.
- **Albion on Day 1.** All three Albion entrants are mostly SIDHE. On Day 1 they gained **0 Tree Mana**, even though CROSSROADS has 12 forest squares: Summer Rade's 12 Mana and Glandore Breakers' 5 Mana all came from Channel Mana, and Cosán Sí Host gained none.
- **Doire** (Albion) can make new FOREST on any map.
- **On TRIPLE HILLS,** an Euskal rifleman can stand on elevation only by stepping into an Objective Area.

## 3. Evidence from battles already played

**Records.** I read 479 record files: every `report.json` and every `games/game-N.json` under `*/battle_reports/`. Dropping exact duplicates leaves **328 distinct battles**. The duplicates are:

- `d22-probe` and `d23-patch`, which copy `d19-out`;
- 8 files in `aimove-old`, which copy Day 1 battles.

All 328 are Seize the Ground on Central Faceoff, dated 2026-10-25 to 10-29. No map file has changed since 2026-10-25 00:45 (git log), so every record was played on today's boards.

**How I counted.** I used the attribution from `cl-day1/analysis/collect.cjs`, after `page/enrich.cjs`:

- A Movement Phase shot counts as Overwatch.
- Losses on the attacker's own side in a melee record count as the defender's melee.
- "Other" covers Burning, failed Fall Back tests and ability effects.

### By map, records from Oct 27 on (closest to Day 1's code)

| | ACROPOLIS | CROSSROADS | TRIPLE HILLS | TWIN LAKES |
|---|---|---|---|---|
| battles | 45 | 97 | 40 | 15 |
| melee share of damage (95% bootstrap) | 38% (33-43) | 41% (38-45) | 40% (36-45) | 34% (25-41) |
| ranged+Overwatch share of damage | 45% (40-49) | 44% (41-47) | 40% (35-45) | **59% (51-67)** |
| melee share of kills | 54% (48-60) | 53% (48-60) | 56% (49-62) | **34% (22-46)** |
| Overwatch shots per battle; HP per shot; shots that did nothing | 7.8; 0.89; 61% | 7.9; 0.90; 60% | 7.6; 0.84; 58% | 5.7; 1.23; 52% |
| median VP margin; margins ≤5 VP | 20; 5/45 | 18; 13/97 | 21; 5/40 | 23; 2/15 |
| mean rounds | 5.00 | 5.05 | 5.38 | 5.20 |
| share of VP from objectives + Primary | 73% | 77% | 75% | 74% |
| A seat won | 24/45 | 48/97 | 19/40 | 7/15 |
| smaller army won (it gets round-1 Priority) | **21/43** | 25/78 | 9/38 | 2/15 |

For comparison:

- **Day 1 (24 battles, CROSSROADS):** melee did 49% of damage and 64% of kills; ranged plus Overwatch did 39% and 25%. Overwatch made 174 shots at 1.03 HP each; the brief says 1.05, and the small gap is down to counting. 56% of VP came from objectives (680 of 1,222), 79% from objectives plus Primary. The A seat won 10 of 24.
- **All 220 CROSSROADS records:** melee 47% of damage, 60% of kills.

The smaller army is the one with fewer units. Priority in round 1 went to it in every battle where the counts differed (`assignRoundPriority`), so the "smaller army" row reads as elite against wide, not as a seat effect.

### Same matchup, same code, different map (the clean comparison)

Each multi-map batch plays one matchup with the maps rotating game by game and the seats alternating. Against the same batch's CROSSROADS games, weighted:

| | batches (weight) | melee damage | ranged+OW damage | melee kills | ranged kills | Overwatch HP/shot |
|---|---|---|---|---|---|---|
| ACROPOLIS | 24 (41) | **+0.3 pts** | −1.2 | +3.7 | −6.6 | −0.01 |
| TRIPLE HILLS | 21 (37) | **+0.7 pts** | −1.8 | −2.0 | +0.2 | +0.04 |
| TWIN LAKES | 4 (6) | −5.0 | **+14.0** | −20.3 | +18.5 | +0.43 |

Melee's share was higher than on CROSSROADS in 14 of 24 batches for ACROPOLIS and 9 of 21 for TRIPLE HILLS, which is what noise looks like.

The paired cohort is `d62`, `d64` and `d67` (Oct 27 20:14-23:37): Longwu Army against Oath of Kraków, Legio XIII, Mihran Spah and Golden Tumen, with 22 battles per map and both seats on every map.

| | ACROPOLIS | CROSSROADS | TRIPLE HILLS |
|---|---|---|---|
| melee damage / melee kills | 33% / 47% | 39% / 50% | 36% / 51% |
| Overwatch HP per shot | 0.87 | 0.67 | 1.02 |
| median margin; mean rounds | 21; 5.09 | **12**; 5.64 | 17; 5.32 |
| Longwu's record | **9-13** | 13-9 | **18-4** |
| vs Golden Tumen / Legio XIII | 1-5 / 2-4 | 4-2 / 3-3 | **6-0 / 6-0** |
| vs Oath of Kraków / Mihran Spah | 4-0 / 2-4 | 3-1 / 3-3 | 4-0 / 2-4 |

**What this shows.**

- The overall melee/ranged split barely moves between these three maps.
- Results for a particular army do move. Longwu fields 13 units, against its opponents' 7-9, and in practice its damage is only 14-34% melee. It dominates on TRIPLE HILLS and loses more often than not on ACROPOLIS. On TRIPLE HILLS vs ACROPOLIS, 18-4 against 9-13 gives Fisher p ≈ 0.01.
- This is one army's view, so treat it as evidence that the choice of map has consequences, not as a ranking of the maps.

### "Did the more melee-heavy army win?"

The question cannot be settled from this data.

- **Judged by each side's own melee share of damage dealt** (a gap of 10 points or more), the more melee-heavy side won:
  - ACROPOLIS 18/33
  - CROSSROADS 46/75
  - TRIPLE HILLS 12/30
  - TWIN LAKES 2/14
  - Day 1: 12/15

  This measure is circular: winning the melee fights is what raises your melee share.
- **Judged by the weapons of each army's templates** (melee AR×DMG against ranged FR×DMG per model), the off-CROSSROADS samples come down to 4-6 matchups. Two examples:
  - Protectores Divini Lateris, the most melee-heavy army there at 72%, lost all 19 of its games against Akathist Convent, across all four maps.
  - Walls of Uruk, which did 66-73% of its damage in melee, lost 1-5 to Sampo's Song on TWIN LAKES and went 1-1 on each of the other maps.

  Neither example separates the map from the matchup.

### Caveats

- **Code versions:**
  - The paired cohort ran before the Oct 28 rule changes: Mounted MOVE, FREE weapons, the Day 1 combat and ability fixes.
  - TWIN LAKES has nothing after Oct 27 09:55.
  - Only CROSSROADS has records on post-Day-1 code.
- **Coverage:** off CROSSROADS, the records cover only 10 factions. Euskal Herria and Albion never played anywhere but CROSSROADS.
- **Sight measures:** they use only terrain and elevation. Units also block lines in battle, and shooters move.

## 4. Options

### A. Keep CROSSROADS for everything

- **Range/melee:** about the same as ACROPOLIS and TRIPLE HILLS in the controlled comparison. Changing the map will not fix the Day 1 lean; the rule levers in `balance.md` (Overwatch on 5+, ranged against DEF 2+ TOUGH) are what would.
- **Factions:** locks out Euskal Herria's identity, Adur Mana and Mountaineer, plus Albion's Stone flow, for all 8 days. Albion's Water flow is dead too. Tree works, over 12 forest squares.
- **Fairness:** mirrored; A won 106/220 overall and 10/24 on Day 1. The smaller (elite) army won 25/78 in recent records.
- **Day 1:** fully consistent. It also has the closest games of any map: median margin 12 in the paired cohort and 16 overall.

### B. Switch to ACROPOLIS for everything

- **Range/melee:** in practice the same as CROSSROADS, and slightly more ranged in the paired cohort (33% against 39% melee damage). By design, the 3 VP objective is decided in close combat: only its 8 neighbours can see it. The 2 VP flanks are open ground.
- **Factions:** turns on all the elevation rules. Euskal gets 40 forward-deployment squares and 16 elevated perches outside the Objective Areas, and Albion gets Stone. It has the second-most forest (28).
- **Fairness:** mirrored, and the most even map for elite against wide armies (smaller army 21/43). Margins are wider (median 20).
- **Day 1:** would need replaying to keep the league on one map. A replay is being considered anyway.

### C. Switch to TRIPLE HILLS for everything

- **Range/melee:** aggregate 40/40. The hilltop objectives are seen from every one of B's zone squares, while the approach is the most covered. Each zone has 6 HEAVY-cover squares for a gun line.
- **Factions:** elevation rules work, but every elevated square lies inside an Objective Area. It has the most forest (36) and the most cover (68 squares), which is good for Brazen Tower, Dies Irae and Iudicium.
- **Fairness:** the most army-sensitive map in the data. Longwu went 18-4 there, and the smaller army won 9/38 and 4/22. No Cross Fire support.
- **Day 1:** would need replaying.

### D. Rotate by matchday, with the knockout on a fixed map (recommended)

- **Schedule:** for example, CROSSROADS on Days 1, 4 and 7; ACROPOLIS on Days 2, 5 and 8; TRIPLE HILLS on Days 3 and 6.
- **Fairness:** each army plays one battle per day, so all 48 armies get the identical map set. That is fair by construction.
- **Range/melee:** these three produce the same aggregate split (38-41% melee damage, 53-56% melee kills), so the rotation will not swing the league's balance. It will spread the map-specific swings (Longwu 18-4 against 9-13) across everyone.
- **Factions:** the elevation rules run on 5 of 8 days.
- **Day 1:** stays valid as a CROSSROADS day, so the map gives no reason to replay it.
- **Knockout:** on CROSSROADS (most data, closest games), or with the maps rotating per game within each best-of-3: G1 CROSSROADS, G2 ACROPOLIS, G3 TRIPLE HILLS.
- **Tooling needed:** `scripts/battle_report/league.cjs` and `tournament.cjs` pass a single `config.map` to every battle (`tournaments/champion_league_s1.json`: `"map": "CROSSROADS"`). A per-day or per-game map list is a small change to that tooling. `batch.cjs` already rotates maps per game.
- **Optional:** put TWIN LAKES on one day as a deliberate ranged counterweight. That would pull the league toward ranged (59/34 there) and lock out Euskal for that day. Its evidence is 15 older battles, so run a batch on current code first.

### E. A mirrored pair: ACROPOLIS and TRIPLE HILLS alternating

- **Why these two:** both have elevation, and in the one matched sample they pull the same army in opposite directions (Longwu 9-13 against 18-4; smaller army 13/22 against 4/22; Fisher p ≈ 0.01 for each). Alternating them should cancel much of each map's bias.
- **Factions:** the elevation rules run on every day.
- **Downside:** Day 1 on CROSSROADS becomes the odd day out unless it is replayed. And you give up CROSSROADS, the map with the closest games.

## 5. Recommendation

Choose **D**: rotate CROSSROADS, ACROPOLIS and TRIPLE HILLS by matchday, keep Day 1 as the first CROSSROADS day, and play the knockout on CROSSROADS or rotate it per game.

The data says the map is not the lever for the range/melee balance; the rules are. So choose the map for breadth and fairness. A per-day rotation:

- gives every army the same maps;
- brings Euskal Herria's and Albion's terrain rules into 5 of 8 days, instead of none;
- keeps any one map from building its own army bias (TRIPLE HILLS for wide shooting armies, ACROPOLIS for elite armies) into the final table.

If one map is preferred for simplicity, keep CROSSROADS and fix Overwatch rather than switching to a single other map.

## Files

All scripts and outputs are in `/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/mapchoice/`. They are read-only over the repo; I edited nothing in it.

- **Reading the records:** `collect.cjs` reads every record and writes `rows.json`. `analyze_rows.cjs` drops the duplicates.
- **Aggregates:** `analyze.cjs` (by map and cohort), `extra.cjs` (bootstrap intervals, Priority, VP sources), `prio.cjs` (army size against Priority).
- **Matched comparisons:** `paired.cjs` (each map against the same batch's CROSSROADS games), `matchup.cjs` (win counts per matchup per map).
- **Board measurements:** `maps.cjs` runs the engine's sight code on the four boards and writes `maps.json`.
