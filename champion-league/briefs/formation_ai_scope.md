# Formation AI and the x-square rule - scope (2026-10-27)

Draft for review. No code changed. Line numbers are as of today's tree.

## 1. Current behaviour

- `_match` needs a living friendly faction unit on every `o` (formations.js:172-173) and NO occupant at all on every `x` (formations.js:168-171). The occupancy map holds alive, on-board units only, one per square (formations.js:142-151).
- `evaluate` scans every pattern at every board anchor (formations.js:259-269), sorts the matches by unit count desc, then `priority` asc (Yellow 1 ... Tortoise 5), then front row, left column and pattern index (formations.js:198-205). It then hands out units greedily, one formation per unit (formations.js:277-301). The result is cached per position key, 256 entries, cleared whole when full (formations.js:222-230, 312-313). The comment there records a 45-second AI freeze before that cache existed.
- `context.positions` overrides a unit's square (formations.js:126-132), but the live rule readers call `Formations.forUnit(unit)` with no context: the `in_formation` predicate (conditional_mod_predicates.js:441-447) and Array Lynchpin's `receiver_in_formation` (aura_engine.js:244-250). The FNP threshold also reads live (feel_no_pain.js:50-51). Expected casualties read that threshold (expected_casualties.js:462, 570). So a hypothetical only prices every formation effect if the units are actually stood on the squares (`withFootprintAt`, unit_position.js:35-48).

## 2. Part 1 - the x-square rule

| | (c) status quo | (a) enemies allowed, friends block | (b) only `o` squares matter |
|---|---|---|---|
| `_match` change (formations.js:169) | none | `if (occupant && occupant.player === player) return null;` | drop the check |
| Random 8 Tang in 6x4 box, no enemy | 16% form one | 16% | 53% |
| same box + 4 enemies | 7% | 16% | 53% |
| 10x8 box, 8 Tang + 6 enemies | 4% | 8% | 12% |

Method: a scratch Node probe loaded the real formations.js and formation_rulesets.js, patched only line 169, and ran 4000 random placements per row (/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/fx/mc.cjs and probe.cjs). Eight units matches the Longwu Army's eight footprints: ten entries, two leaders joined (five_banner_army.json `leaderMap`).

- **(c)** Any enemy that steps into a gap dissolves the formation for every member. That includes a charger landing beside a member inside the box. White Tiger's melee bonus can therefore only survive contact from outside the diagram's bounding box. In the probe, an enemy in an Azure Dragon gap downgraded it to Vermilion Bird.
- **(a)** With no enemies on the board, the result is the same as today. Next to enemies it roughly doubles how often a formation forms. Tang still has to keep its own units out of the gaps, so the shape discipline stays. The enemy's counterplay becomes killing or displacing a member, or standing on an `o` square before it is filled. Enemy positions can no longer change the result, so `_evaluationKey` could skip enemy units (formations.js:235-240) and get more cache hits. Open: should a friendly Structure or non-Tang ally in a gap block? As written, yes.
- **(b)** Easy to exploit. Every diagram is a sparse subset of a dense block, so blobs match by accident:
  - 5 units in a row = Black Tortoise.
  - A 2x5 block = White Tiger + Vermilion Bird. The two tie, so there is no Surge (formations.js:207-220).
  - It also changes which formation a deliberately built shape becomes. Two spaced ranks (`T.T.T.T / ... / T.T.T.T`) are Black Tortoise x2 today but White Tiger x2 under (b), because White Tiger (priority 3) outranks Tortoise (5) once gaps stop disqualifying it.

**Recommend (a).** What changes with it:
- The rule text: core_system.json:84 (`x is an empty square`) and the deep dive (doc/shared-fantasy-mechanics-deep-dive.md:1481-1482). Regenerate the docs.
- The one test of the branch, 091_jade_mandate_formations.js:139-151 ("occupied empty squares block formations"). Rewrite it to: an enemy in a gap does not block, a friend does. No new test is needed, because the branch already has one.

## 3. Part 2 - the AI feature

### Why the AI never forms or keeps one

- The destination scorer's damage readings ignore the square. `_aiOffensivePotential` calls `aiExpectedDamage(unit, e)` (basic_positioning.js:329), and threat reads `aiExpectedDamageAt`, which adjusts only for works (works_fire_share.js:66-70). A unit already in formation gets the bonus at EVERY square, and one outside gets it at none. Breaking a formation looks free, and so does completing one.
- Moves are decided one unit at a time. `aiDecideMovement` takes the first unit, in `_aiSortMovePriority` order (destination.js:255-282), that has a worthwhile move, and returns that single move (decide.js:48-156, 177-184). Players alternate one move per call (destination_choice.js:146-149).
- There is no group concept. Every plan belongs to one unit: missives (missives/assignment.js:14-23), `AI.globalTargets` (global_target.js:20-23), `AI.advancePlan` (advance_plan.js:19-21) and `AI.moveOrderPlan` (command/choose.js:36).
- Deployment pushes units apart: -0.3 per adjacent friend (ai_deploy.js:112-118). That spacing likely explains the accidental round-1 Black Tortoise (`oxoxo`).

### Where the term plugs in

Add a named term `formation` to `_aiDestinationTerms` (destination.js:123-209) and to its total (destination.js:190-196). `aiScoreDestination` caches the total per decision (destination.js:211-218; cache.js:253-265). Three other places need it:

- **Global planner.** When objectives exist, the global planner runs first and can return before any local candidate is compared (destination_choice.js:79-116). It sums named terms, not `total` (ai_path_finding.js:122-140), so add `+ (bd.formation || 0) * decay`, volatile like `support`. Keeping a formation already works through `stayScore` (destination_choice.js:39, 89).
- **Granted moves.** They use the same choice: To Formation! is a `grant_move` on the Five-Banner Marshal, and Azure Banner Braves have Flowing File. A `grant_move` is worth its destination improvement (effect_value.js:197-202; command/support.js:212-223). The new term therefore makes the Marshal's ability worth using to close a formation in the Action Phase, with no extra wiring.
- **Charges.** A charge weighs `aiScoreDestination` at the landing square against staying (evaluators.js:305-306), so it automatically has to beat losing the formation.

The term must be exactly 0 for a faction with no formation ruleset. Then the destination-score fingerprint test (rules_refactor/417), whose fixtures include no Tang units, does not move.

### Pricing - what the bonus does this round

`aiFormationRoundWorth(instance)` = the members' offence + their protection:

- **Offence:** the sum over members of `aiUnitAttackChance(member, kind)` (attack_use_chance.js:143-164) times (`aiUnitAttackWorth` with the formation less without; ap_change_value.js:17-27). This is the `aiBuffAttackGain` shape (buff_attack_gain.js:50-56).
- **Protection:** for each enemy that can still attack, its best attack's worth on the members without the formation, less with it. This is the `aiGuardPrevented` shape (guard_value.js:74-90).
- **"With"** stands the moving unit on the square with `withFootprintAt`, inside `_aiWithScratchMoveEvalCache` (cache.js:129-134), as `aiWithBuffOn` does (buff_reading.js:34-43). Every reader then sees the formation: HIT, PER, AP, SUSTAINED, the SAVE roll, FNP, and the `in_formation` gear and abilities (Tiger-Head Dao, Phoenix Payload, Dragon Uncoils, Qi-Reinforced Clay, Tiger Ferocity, Array Lynchpin).
- **"Without"** needs a new engine switch, `Formations.withoutFormation(player, instanceKey, fn)`. It pins `evaluate`'s answer minus that formation, skips the position cache, and runs inside `rulesReadingAside`. Removing the contributor is not enough: that is what the recorder does (page_formations.js:19-22, 33-42), and it misses FNP and every `in_formation` reader. The recorder should switch to the new function too, so one implementation serves both.
- Convert to the destination scale with a new coefficient, `W_FORMATION`, in ai_coefficients.js. Charges use the same pattern, with `W_CHARGE_COMBAT` at ai_coefficients.js:131.
- Not priced:
  - Morale: Black Tortoise's +1 and Signal Discipline. The AI has no reader of what a Morale Test is worth (only MORALE BREAKER, attack_scoring.js:101-110).
  - Yellow Dragon's +1 OC.
  - The Surge rite discount.

  Each needs its own reader and is a follow-up.

### Cost limits

The scorer runs for every reachable square of every unit. The planner runs it for every board square, with no cache (destination.js:247-251; ai_path_finding.js:161-180). Moving units per square would miss the position cache every time and repeat the 45-second freeze. So:

1. Gate on the faction having a ruleset. Otherwise return 0.
2. Once per decision, in a lazily created move-eval cache slot like `buffBaseWorth` (buff_attack_gain.js:32-40), store the side's current state (one cached `evaluate`), a map from each formation's `x` cells to that formation, and each formation's worth. The worth is computed only when first asked.
3. **Keep/break per square is a lookup:**
   - A member's own square scores +worth of its formation, because leaving breaks it for every member.
   - A non-member friend scores -worth on another formation's `x` cell, because under (a) a friend in a gap breaks it.
   - Every other square scores 0.
4. **Complete (stage 2)** is only checked on squares that pass two cheap filters:
   - the square is in the cached reachable set, so the planner's whole-board scan skips it otherwise;
   - at least two faction units stand within Chebyshev 4.

   Those squares then run an anchored probe: each pattern placed so one of its `o` cells falls on the square, at most 36 placements. A full `evaluate` with a `positions` override runs only where the probe hits, so exclusivity and priority are respected. A full scan on a 15x15 board is about 1650 placements.
5. Price each distinct instance once per decision, at most the 3 per unit with the highest summed member worth. Skip the estimates, and return 0, when no member can attack and no enemy can reach a member this round.

### Staged plan

| Stage | Adds | Tests (one per new code path) |
|---|---|---|
| 0 Rules | option (a) | rewrite 091:139-151 |
| 1 Keep | `Formations.withoutFormation`; `ai/movement/formation_worth.js` (instance worth); `ai/movement/formation_term.js` (keep/break term); `W_FORMATION`; the term in destination.js and ai_path_finding.js | rules_refactor: the switch hides membership, `in_formation` and FNP, and restores even on a throw. ai: worth > 0 with an enemy in reach, 0 without. ai: a member's own square beats a neighbour by the worth, a gap scores -worth, a non-Tang unit scores exactly 0 |
| 2 Complete | `Formations.matchesThrough(player, col, row, ctx)` (anchored probe); completion branch in formation_term.js | rules_refactor: the probe reports a completing square and not a non-completing one. ai: a completing reachable square scores the instance's worth |
| 3 Form | `ai/movement/formation_plan.js`: at the phase's first decision, pick the cheapest instance that unmoved units can fill; assign members to cells; pull assigned members toward them; drop the plan when an `o` cell is taken or a member dies or is ENGAGED. Store it on `AI` by player, because AI memory travels to the worker whole (handoff/memory.js:5-13, enforced by generator/ai_memory_audit.py) | ai: plan choice; ai: plan invalidation |

Stage 3 must value next-round worth (`opts.nextRound`, as `_aiOffensivePotential` does): a formation takes several alternating moves to build.

- **Registration:** register new files in `MODULE_LOAD_ORDER` beside the movement block (generator/modules.py:443-465).
- **File size:** formations.js is 503 lines, and both stages edit the matcher. I recommend first moving `_cell`, `_match`, `_occupancy` and `_candidateSort` (formations.js:121-205) into `core/formation_matcher.js` as a separate change, proved line for line, rather than growing formations.js past 500 lines.
- **Optional deployment term** in a new file next to ai_deploy.js. Deployment has no alternation pressure, so it is a cheap place to start a Vermilion Bird of the two rocket batteries.

## 4. Measuring success

- **Uptime.** page_formations.js snapshots membership as each Movement Phase ends (page_formations.js:45-66), and mechanics.cjs:58-70 prints units inside / on board per round. Baseline: 6 of 320 unit-rounds (1.9%), all round 1, no attack changed. Proposed targets:
  - Stage 1: a formation that exists while enemies are in reach survives to the Action Phase.
  - Stage 2+: at least 20% uptime from round 2 on.
- **Effect.** Attacks whose `gain` > 0 and their total gain. Once the recorder uses `withoutFormation`, this also counts FNP and the `in_formation` abilities.
- **Results.** The win rate of the same Longwu matchups and seeds in a batch (batch.cjs).
- **Cost.** Movement decision time from ai_perf.cjs / page_ai_perf.js. Budget: at most 10% slower per Tang decision. The 417 fingerprint must not change.

## 5. Found while scoping (not part of this change)

- **Joined pair loses its formation.** Because `_occupancy` keeps one unit per square, a joined CHARACTER and its squad count as one `o`. Only whichever comes later in `G.units` becomes a member, and the other gets no formation bonus at all. A scratch probe confirmed it (/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/fx/joined.cjs: the squad was `null`, the CHARACTER Black Tortoise). Both Longwu leaders are joined. This is a separate bug fix, with its own test.
- **Recorder blind spots.** The recorder's "without" leaves FNP and `in_formation` effects in (page_formations.js:19-22), so it under-counts formation gain.
