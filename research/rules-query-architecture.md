# A fast, exact query architecture for the WARFRONT rules engine

Research note, 2026-10-24. Nothing in the repository was edited.

## 0. What the profile is actually paying for

The hot functions are not slow one at a time. They do the same work again on every call, and some of that work stops the existing memo from ever hitting.

- **`Weapons.profile` caches nothing** (`core/weapons.js:396-457`). Every call does all of this:
  - deep-clones the weapon (`_clone`, :46);
  - recomputes the active tags, asking `contributedWeaponTags` twice (:294 and :406-409);
  - re-reads the modifier records through `Modifiers.list`, which clones and freezes every record (`core/modifiers.js:416-420`) and normalises `selector.stat` once per record (`_modifierMatches`, :287-290);
  - sorts with `localeCompare` twice (:149, :451) and deep-freezes the result (:456);
  - runs `_applyCombatProfile`. `Weapons.groups` (:580-633) does all of this once per model per weapon, so a 10-model squad pays it 10 times.
- **`_applyCombatProfile` copies both units** with `_cloneCombatUnit` (:173-182, :206-207). The copies are new objects, so every identity-keyed memo inside the hooks misses:
  - `auraModifier` keys on the receiver (`combat/aura_engine.js:367`);
  - `has_weapon_tag` keys on the unit (`abilities/ops/conditional_mod_predicates.js:155`);
  - `Stats.model` throws away an answer whose `kept.unit !== unit` (`core/stats.js:165`).

  The reading's Map also gains a dead entry for each copy. The copy is not even a real shield, because `models` is shared shallowly.
- **`collectCombatEffects` walks every registered effect on every call** (`combat/effects/registry.js:26-40`). That is about 117 data effects plus about 12 hand-written ones. About 90 of the data effects decide membership by ability (41 default-ability, 25 `defenderAbility`, 14 `ability`, plus gear, pair and in-group ones). Each of those calls `_findAbilityById` (`abilities/availability/target_validation.js:463`), which:
  - scans the unit's abilities linearly;
  - recomputes `abilityIdentityKey(wanted)` once per ability inside `_abilityIdentityMatches` (:449-452);
  - on the common miss, goes on to `_defaultAbilityForUnit` and `_abilityDataByNameOrId` (:420-447).

  In total that is effects × abilities × (a WeakMap lookup, a Map lookup and 6 field compares), once per profile, per model.
- **`_scanAuras` re-derives the emitters for every receiver** (`aura_engine.js:299-322`). For each descriptor on the channel it loops over every unit and calls `_auraSourceActive` → `_findAbilityById` again. Which units emit does not depend on the receiver.

## 1. Survey: techniques that fit

| Technique | Source | What it means here |
|---|---|---|
| **Derived value with a dirty flag**: recompute only when an input changes | Nystrom, *Game Programming Patterns*, "Dirty Flag" | A unit's modifier buckets are rebuilt only when `_modifierProject` runs. |
| **Attribute aggregators** (Unreal GAS): `CurrentValue` is the stored result of the mods' formula. Mods sit in channels. The aggregator is marked dirty when mods are added or removed (`OnDirty`). Tags are counted (`TagMapCount`). | Epic `FAggregator` / `FAggregatorModChannel` API; tranek GASDocumentation §4.4.7, §4.5, §4.1 | Per subject, keep `domain\|stat → records[]` buckets. Today `Stats` and `Weapons` re-filter `_modifiers` on every read. |
| **Modifier dependency nodes** (Paradox): nodes record their dependencies. Stale nodes and their dependents are recomputed, and only when used. | Victoria 3 Dev Diary #76; Stellaris Dev Diary #149 | The same idea at strategy-game scale. The lesson is to invalidate selectively from the write side, never to recompute everything on every read. |
| **Revisions and durability** (Salsa / rustc red-green): a global revision moves on each input write, every input records when it last changed, and a memo is valid while none of its inputs moved. "Durability" skips the check for inputs that rarely change. | Salsa book, "The red-green algorithm"; rustc-dev-guide, incremental compilation | Split state into families (loadout, modifiers, positions, board, clock) with their own revision stamps, so an answer that reads no positions survives a hypothetical move. |
| **Version-number signals**: each signal carries a version, a global version gives a fast "nothing changed" path, and values are computed lazily on read | Preact, "Signal Boosting" | The global fast path is what `rules_reading.js` already is (a span with no writes). Per-family versions are the next refinement. |
| **Demand-driven incremental computation** | Hammer et al., *Adapton*, PLDI 2014 | Compute only what is asked for, so laziness keeps the cost proportional to the AI's actual queries. Full dynamic dependency tracking is overkill here, because most reads (`unit.flags.x`, `unit.col`) bypass any accessor. |
| **Discrimination networks / indexed rule matching**: alpha memories by condition, hash indexes | Rete (Forgy 1982; Wikipedia summary; Doorenbos's hash-indexed variant) | Bucket combat effects by membership key, so a query visits only the effects a unit could match. |
| **Cached ECS queries**: matching happens when the query is created and when the archetype set changes; iteration walks the stored match list | Flecs Queries manual | Same shape as `_auraChannelBucket` (`aura_engine.js:55-70`): a derived index rebuilt when the registry's count moves. |
| **Make/unmake with incremental updates; check against a from-scratch recomputation in debug builds** | chessprogramming.org: Make Move, Incremental Updates, Zobrist Hashing | `withFootprintAt` and the other `with*` helpers are make/unmake. Because an unmake restores the state exactly, it may also restore the revision stamps. The debug check is the exactness proof. Zobrist keys are not needed, since the board is never revisited the way a chess transposition is. |
| **Interned tags** (FName / GameplayTag: integer ids, containers) | GASDocumentation §4.1; Unreal `FGameplayTagQuery` | Parse `"SUSTAINED ATTACK 2"` once per string. Strings are immutable, so a parse memo can never go stale (the same argument as `abilityIdentityKey`). |
| **Shapes and inline caches; data-oriented design** | Bynens, "Shapes and Inline Caches"; Acton, CppCon 2014 | Stop allocating per call (clones, `{used}` maps, closures) and return one stable result shape. |

## 2. Recommended architecture

There are three layers, and each is exact by construction for a stated reason.

### Layer 1: compiled indexes (valid for the battle)

These are derived from the registries and rebuilt when a registry's count changes. They are never maintained by hand beside the registry, which keeps the one-source rule.

- **Effect index** (`combat/effects/registry.js`). `defineCombatEffect` (`dsl.js:546`) records a membership key on each handler, for example `{kind:'ability', value:'charge_drill'}`, and a registration ordinal. The registry derives:

  `domain → { always[], custom[], byAbility{}, byDefenderAbility{}, byFlag{}, byStatus{}, byTag{}, byFaction{}, byDoctrine{}, ... }`

  `collectCombatEffects` then:
  1. takes the union of the buckets addressed by the attacker's and defender's keys;
  2. sorts the candidates by ordinal, so the fire order is unchanged (replays depend on it);
  3. still calls each candidate's `applies()`, so the candidate set is a superset and the result is identical.

  Effects with hand-written `applies` functions (`sweep`, `dual_wield`, `sustained_attack`) go in `custom`.
- **Tag table.** `parseWeaponTag(str) → {key, name, param}` is memoised by string. `weaponTagParam` and `_dslTagName` use it.
- **Aura channel buckets.** These already exist.

### Layer 2: per-entity derived records, stamped by revision (valid across readings)

Use these only for families that already have a single write path.

- **Modifier buckets.** `_modifierProject` (`modifiers.js:163`) already runs on every apply, remove, expire, recalculate and import. It bumps a modifier revision and rebuilds a WeakMap from subject to buckets. `Stats._records` (`stats.js:43`) and `Weapons._typedRecords` (`weapons.js:126`) then read a bucket instead of a cloned, filtered list.
- **Ability index per unit.** This is a `Map<lowerKey, ability | null>` covering abilities, gear and RUNESMITH default actions, with misses included. It is valid within a reading today. It becomes valid across readings once the 12 direct `unit.abilities` writes go through one owner with a build audit, in the style of `generator/position_write_audit.py`.

All side tables live in module-scope WeakMaps, never as fields on a unit. `G.units` is deep-cloned and checksummed (`doc/battle-state-registry.md`, "Unit-level state"). A restored unit is a new object, so it misses automatically, and checksums and replays never see the caches.

### Layer 3: query memo, scoped to a reading (the volatile answers)

This covers `Weapons.profile`, `Weapons.groups`, `collectCombatEffects`, `Stats.model` / `Stats.unit` and the aura queries. Their answers depend on positions, flags, statuses and round marks, which have no single write path (54 flag writes, 24 status writes, 20 `alive`, 21 `moved`). The existing contract (a reading spans no write) is therefore the right validity rule, and it should be extended to all of them:

- Key on object identity, not uids. Probe units such as `_aiCommandRequisitionProbeUnit` may not have unique uids. Add a two-key variant `rulesReadingMemo2(a, b, question, compute)` to `rules_reading.js`.
- **Profile key:** weapon object, then the unit and model, then the target (or none), the `Weapons.resolvingProfile()` flag, `preview`, and `checkpoint.round`. Cache only when the context has nothing beyond `{preview, target, checkpoint}`, mirroring `Stats._plain` (`stats.js:154`). The result is already deep-frozen, so sharing it is safe.
- **Groups key:** unit, weapon type and context key. Return fresh group shells, because callers mutate them (`_addGroupModel`, `standing`).
- **Aura emitter table, once per reading per channel:** `[{desc, src, range}]` for the active sources. The range is fixed unless the descriptor's `range_stat` is `receiver_per`. Each receiver then checks only its side, its gate and the distance.

### Invalidation and exactness

| Write | Bumps or ends | Choke point today |
|---|---|---|
| Modifier record added, refreshed, removed or expired | modifier revision → Layer 2 buckets | `_modifierProject` (`modifiers.js:163`) |
| Unit moves or is lifted | ends the reading (aside) | `placeFootprint`, `removeFromBoard` (`core/unit_position.js:14-31`), audited |
| Ground or works change | aside | `withGroundChanged` (`board/ground.js:36`), `withStructureLifted` (`structures/reading.js:15`) |
| Status, flag, round mark, `alive`, `hp`, `moved` | aside (no single write path yet) | `applyStatus` (`status_apply.js:75`), `markRound` (`round_state.js:42`); flags have none |
| Ability, gear or weapon attached or detached | ability-index revision (after an audit) | `detachable_features.js`, 12 direct sites |
| Registry growth (lazy data registration) | index rebuild by count | `ensureCombatEffectsFromData`, `registerAura` |
| Replay restore, MP apply, battle start | everything (new objects, new epoch) | `unitFromState` |

**Hypotheticals ("with and without", a unit standing on another square).** Every hypothetical write I found already runs inside an aside:

- `withFootprintAt` (`unit_position.js:35`)
- `withFootprintMoved` (`core/movement/apply.js:29`)
- `_aiWithUnitGone` (`ai/missions/death_vp.js:20`)
- `withGroundChanged`, `withStructureLifted` and `withWorksStanding`
- `aiChargingMeleeDamage`, through `_aiWithScratchMoveEvalCache` (`ai/movement/fall_back_weighing.js:88`)

I found no AI code that takes Modifiers records off and puts them back. If it exists or is planned, it has to use the same scope.

Make the scope a single API: `rulesHypothetical(make, read, unmake)` opens the aside first, then makes, reads and unmakes. That rules out the ordering hazard by construction. The reading contract should also be *enforced*, not assumed. In a verify mode, each write choke point (`_modifierProject`, `placeFootprint`, `applyStatus`, `markRound`, `setSquareTerrain`) throws when a reading is open and no hypothetical scope is active.

**Later refinement (Salsa-style durability), only if measurement justifies it.** Give each family a revision stamp drawn from one monotonic counter, so a number is never reused. A Layer 3 entry stores the stamps of the families it declares. `rulesHypothetical` saves the stamp vector and restores it on unmake. Restoring is sound only because the unmake restores the state bit for bit (the chessprogramming argument), and a fresh number is allocated for every real write afterwards. A loadout-only answer, such as the ability index or effect membership, would then survive a `withFootprintAt`.

**Proof of exactness.** Add a `rulesVerify` switch to `rules_reading.js`. On every memo hit it recomputes and deep-compares, and throws with the key on a mismatch. It runs in the AI-vs-AI suites. It runs the one implementation twice, so it is not a second copy and does not break the one-source rule. A second switch disables every memo, and a replay with memos on must equal one with them off.

## 3. Migration plan

Every step is proved the same way: an identical replay of a fixed set of AI-vs-AI seeds, plus a run with `rulesVerify` on. The steps are ordered by expected gain per effort.

0. **Measure** (`core/rules_reading.js`, a profile script). Count hits and misses per query, and the time spent inside asides. Add `rulesVerify` and the memo-off switch. Behaviour does not change. This sets the targets for step 9.
1. **Memoise `Weapons.profile` and `groups` within the reading** (`weapons.js:396`, `:580`; `rules_reading.js` gains `rulesReadingMemo2`). This is the largest expected gain: the profile accounts for 420 s, and repeat calls inside an AI choice are the common case. The diff is small. Risk: an uncacheable context gets cached. Mitigation: an allow-list of keys plus the verify mode.
2. **Zero-copy reads.**
   - `_typedRecords` and `Stats._records` read `Modifiers.stored`.
   - `_modifierMatches` normalises the selector once per call.
   - Skip the sort when there is at most 1 record.
   - Compute `contributedWeaponTags` once per profile.
   - `Models.all` (`core/models.js:35-68`) stops allocating twice.

   Files: `modifiers.js`, `stats.js`, `weapons.js`, `models.js`. This attacks most of the `_freeze` self time (34 s), plus clone churn. Risk is low: the same records arrive in the same order.
3. **Drop `_cloneCombatUnit`.**
   - Pass the real attacker and target, and use one frozen `NO_TARGET` placeholder.
   - Skip `speculative:false` effects in *both* profile hooks (today only `modifyDicePool` skips them, `weapons.js:235`).
   - Make the DSL validator refuse side-effect ops on `modifyWeapon`.

   Gain: 78 s of self time, and the aura, `Stats` and `has_weapon_tag` memos start hitting inside profiles. Risk: an identity-sensitive predicate now answers differently. A replay diff would expose a latent disagreement between preview and resolution, which should be fixed as a bug, not masked.
4. **Effect index** (`registry.js`, `dsl.js:120-191`, `from_data.js`). Bucket by membership key, sort candidates by ordinal, keep `applies()`. `combatCtxForDefender` (:65) benefits too. Gain: most of the 168 s in `collectCombatEffects` and most `_findAbilityById` calls. Risk: an order change. Mitigation: ordinals, plus verify mode.
5. **Ability lookup** (`target_validation.js:449-465`, `ability_identity.js`). Hoist `abilityIdentityKey(wanted)` out of the loop now (exact, one line). Add a per-unit, per-reading index that includes misses and the RUNESMITH default actions. Gain: what remains of the 110 s.
6. **Aura emitter table** (`aura_engine.js:299`). Gain: most of the 53 s in `_scanAuras`. Risk: the `receiver_per` range and `exclude_self` checks must stay per receiver.
7. **Modifier buckets** (Layer 2, `modifiers.js:163`, `stats.js`, `weapons.js`). Gain: `Stats._model` (83 s) outside readings, which matters during resolution.
8. **Tag parse memo** (`units/factory/weapon_tags.js:53`, `dsl.js` `_dslTagName`). Small and safe.
9. **Optional: durability revisions** across hypotheticals, plus write audits for abilities, statuses and round marks. Do this only if step 0 shows that asides cost a meaningful share. Flags come last: 54 sites, the largest piece of work.

UI note (out of scope): `drawBoard`, `_unitListRow` and `renderUnitCard` should redraw behind a dirty flag keyed on the same revisions (Nystrom), rather than on every state change.

## 4. What would block it in the current code

1. **Copies that defeat identity memos.** `_cloneCombatUnit` (`weapons.js:173-182`), as described in §0.
2. **Reads with side effects.**
   - A `modifyWeapon` effect with side-effect ops would run during a preview, because only `modifyDicePool` skips `speculative:false` (`weapons.js:235`). No data uses this today; `envious_gaze`'s `force_test` sits on `modifyDicePool`.
   - `Models.all` → `ensureRosterIdentity` writes `modelInstanceId` lazily (`models.js:42-46`).
   - `ensureCombatEffectsFromData` registers effects lazily from inside a read (`registry.js:28`).
3. **Answers that depend on re-entrancy.** While a profile is being built, `activeTags` returns the weapon's raw tags (`weapons.js:656`, `_weaponsResolvingProfile`), so every key must include `resolvingProfile()`, as `has_weapon_tag` already does.
4. **Readers going around the owners.**
   - `Modifiers.stored` callers (`grants.js:97`, `capabilities.js:74`, `unit_tags.js:60`, `models.js:445`, `conditional_mod.js:74`) are fine, because they are read-only.
   - `units/from_state.js:41-46` rebuilds `_modifiers` from saved state. That is a new object, so it misses, which is correct.
   - There are no other direct `_modifiers` readers. Any test that mutates records directly bypasses `_modifierProject` and will be caught by verify mode.
5. **Hypothetical writes with no choke point.**
   - `death_vp.js:24` (`alive`), `apply.js:31` (`moved`).
   - Direct restores in `ground.js:51-55` and `structures/reading.js:18-24`.

   These are safe today because each sits inside an aside. They block cross-reading revisions until they go through owners.
6. **Shared mutable results.** `Weapons.groups` returns mutable group objects (`weapons.js:599-631`), so memoised groups must be handed out as fresh copies.
7. **Uncacheable contexts.** The melee path calls `groups(attacker, 'melee', Object.assign({}, opts, {target}))`, which carries arbitrary `opts`. Either normalise the keys that matter or leave it uncached.
8. **Cache state on `G` or on units.** It would enter checksums and replays, so keep it in module WeakMaps. A module-scope `var` needs no `registerBattleStateField`.
9. **A second cache layer.** `AI._moveEvalCache` slots (`ai/movement/cache.js:22-64`) and `_aiDecisionMemo` already memoise some rules answers (`usableGroups`, `effectiveRange`, `rangedDamage`). Once the rules memoise themselves, do not add more AI slots for rules questions, and retire the redundant ones as their own change.
10. **Bloat note.** `aura_engine.js` (542 lines), `dsl.js` (576), `weapons.js` (707) and `modifiers.js` (516) are all past ~500 lines. New code (`rules_revision.js`, `effects/index.js`, `aura_emitters.js`, `modifier_buckets.js`) should go in new files registered in `generator/modules.py`, not appended.

## Sources

- R. Nystrom, *Game Programming Patterns*, "Dirty Flag": https://gameprogrammingpatterns.com/contents.html
- Epic, `FAggregator` API: https://dev.epicgames.com/documentation/unreal-engine/API/Plugins/GameplayAbilities/FAggregator ; `FAggregatorModChannel`: https://docs.unrealengine.com/4.26/API/Plugins/GameplayAbilities/FAggregatorModChannel/index.html ; `OnAttributeAggregatorDirty`: https://docs.unrealengine.com/4.26/en-US/API/Plugins/GameplayAbilities/UAbilitySystemComponent/OnAttributeAggregatorDirty/index.html
- tranek, GASDocumentation (aggregators, `TagMapCount`, tag containers): https://github.com/tranek/GASDocumentation
- Paradox, Victoria 3 Dev Diary #76 "Performance": https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-76-performance ; Stellaris Dev Diary #149: https://forum.paradoxplaza.com/forum/threads/stellaris-dev-diary-149-technical-improvements.1180597/
- Salsa, "The red-green algorithm" (revisions, durability, backdating): https://git.joshthomas.dev/mirrors/salsa/raw/branch/gh-pages/reference/algorithm.html ; rustc-dev-guide, incremental compilation: https://rust.googlesource.com/rustc-guide/+show/refs/heads/master/src/queries/incremental-compilation.md
- Preact, "Signal Boosting" (version numbers, global version, lazy computed): https://preactjs.com/blog/signal-boosting/
- M. Hammer et al., *Adapton: Composable, Demand-Driven Incremental Computation*, PLDI 2014: https://people.mpi-sws.org/~hammer/adapton-pldi2014.pdf
- Rete algorithm (alpha memories, hash-indexed variant): https://en.wikipedia.org/wiki/Rete_algorithm ; Forgy's paper (OCR): https://www.csl.sri.com/users/mwfong/public_html/Technical/RETE%20Match%20Algorithm%20-%20Forgy%20OCR.pdf
- Flecs Queries manual (cached vs uncached queries): https://github.com/NrdyBhu1/flecs/blob/master/docs/Queries.md (a fork's copy; the official docs may have moved on)
- chessprogramming.org: Make Move https://www.chessprogramming.org/Make_Move ; Incremental Updates https://chessprogramming.org/Incremental_Updates ; Zobrist Hashing https://www.chessprogramming.org/Zobrist_Hashing
- Unreal `FGameplayTagQuery`: https://docs.unrealengine.com/4.27/API/Runtime/GameplayTags/FGameplayTagQuery/index.html
- M. Bynens, "JavaScript engine fundamentals: Shapes and Inline Caches": https://mathiasbynens.be/notes/shapes-ics
- M. Acton, "Data-Oriented Design and C++", CppCon 2014: https://isocpp.org/blog/2015/01/cppcon-2014-data-oriented-design-and-c-mike-acton
