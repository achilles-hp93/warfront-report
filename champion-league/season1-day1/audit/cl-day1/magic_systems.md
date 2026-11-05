# Champion League Day 1 - faction magic systems: does the Mana rule run?

Branch `cl-d1-magic` (worktree `/home/user/warfront/.claude/worktrees/cl-d1-magic`).
Every faction's `data/editions/fantasy/magic/<faction>/core_system.json`, the machine form
that runs its resource rule, the engine code that reads that form, and what the Day 1 records
show (`report.json` `resources`, summed by reason; `digest.cjs` pool lines).

How a core system's rule runs (the five shapes in use):

- **`income[]`** - `runMagicSystemIncome(phase)` (`engine/modules/edition/magic_system/mana.js`),
  called at `command_phase` (`phases/command_flow.js:113`), `end_of_movement_phase`
  (`movement/phase_flow.js:69`) and `end_of_action_phase` (`phases/action_cleanup.js:64`).
- **`effects[]`** - `magicCoreDefinition` (`mana.js`) puts the core system on every unit of its
  faction: event lines (`on:`) fire through `fireAbilityEvent` (`abilities/runtime/events.js:355`),
  standing lines (`grant_ability`, `block_action`, `mod_channel_mana`...) apply as passives
  (`units/flags/passive_apply.js:59`).
- **`resource_pools[]`** - `faction_resource_pools.js`: `gain[]` (`round_end`:
  `runResourcePoolRoundEnd`, `phases/action_cleanup.js:207`), `income[]` (`runResourcePoolIncome`,
  `command_flow.js:106`), deed ladders (`resource_pool_ladders.js`).
- **`praying_mana: true`** - `grantPrayingMana` (`magic_system/covenant_antiphons.js:209`), end of the
  Action Phase.
- **Faction identity data** (not the core system) - Soul Markers' `on_removed`
  (`core/markers.js:125` `removeMarker`) and a designation token's `on_spent_hit`
  (`core/designation_tokens.js`).

Every MAGIC_CASTER also has the core Channel Mana action (`magic_system/rites_cast.js:130-152`).

| Faction | System | Generation rule as written | Machine form -> engine | Implemented? | Day 1 |
|---|---|---|---|---|---|
| Atashid Empire | Hymns of Atar | +1 Radiance a Battle Round the Bearer took no HP damage and did not Fall Back; each Command Phase, Mana = Radiance | `resource_pools[radiance]`: `gain round_end` (is_designated sacred_flame, undamaged_this_round, has_not_fallen_back) + `income command_phase into mana amount value` -> `runResourcePoolRoundEnd`, `runResourcePoolIncome` | Yes | Worked. M01 Radiance +4, Mana 10 (1+2+3+4); M21 Radiance +3, Mana 6 |
| British Liberation Front | House of Glass | End of the Action Phase: 4 Mana per friendly PENDRAGON KNIGHT in Transitional State | `income end_of_action_phase amount_per_unit 4` (has_tag PENDRAGON KNIGHT + in_transitional_state) -> `runMagicSystemIncome` | Yes | Never paid: no Knight was ever put in Transitional State (M04, M09 - Gatescrolls unused, an AI gap). Mana came from Channel Mana (M04 9) and Archimagus Supremus (M09 6) |
| Caliphate of the Two Sanctuaries | Ilm al-Raml | Start of your Command Phase: 3D6 per friendly MAGIC CASTER, 1 Mana per odd die | `effects: add_resource on command_phase`, target_requires MAGIC_CASTER, `{roll 3D6, count odd}` -> `command_flow.js:100` | Yes | Worked. M07 6, M22 18 (M19 Horns of Hattin fields no caster: 0) |
| Church of the Beast | Dream of Trillion-Face Beast Lord | Each successful Charge by a friendly CoTB unit: 2D3 Mana | `effects: add_resource on charge_complete {roll 2D3}` -> `core/movement/charge.js:218` | Yes | Worked. M07 35 Mana from 9 charges (29 unspent) |
| Covenant of New Jerusalem | Antiphonary | End of the Action Phase: 1 Mana per PRAYING unit (alive, has not attacked or used an ability this round) | `praying_mana: true` -> `grantPrayingMana` | Yes | Worked. M03 24, M06 24, M15 29, M19 14, M20 27, M21 16, M22 30, M24 28 (M15 Chonae Wing has no caster: unspendable) |
| Duat Dominion | Anubis' Toll | +4 Mana each time a Soul Marker is removed for any reason, incl. the instant denial of an attached pair's marker | Faction identity `markers[soul_marker].on_removed: add_resource 4` -> `removeMarker`; the denial in `placeUnitMarkers` (`core/markers.js:111-117`) | Yes (the core system needs no machine block) | Worked. M16 1 marker removed, +4 |
| Empire of Nihon | Shikigami Relays | No Mana generation rule (Shikigami Tokens, casting through a token) | `starting_structures`, `effects: cast_relay` | n/a - Mana only from Channel Mana | M18 0 Mana: no caster channelled or cast (AI) |
| Euskal Herria | Adur | After a friendly INFANTRY unit on ELEVATION 1+ makes a ranged attack that hits: 1 Mana, at most 5 a round | `effects: add_resource on after_hit, attack_kind ranged, when on_elevation, once_per_activation, max_per_round 5` -> `combat/hit_event.js:28` | Yes | **Cannot trigger on CROSSROADS** (no square at ELEVATION 1+). M11 0 from Adur; Mana came from WEATHER-READER (+2) and Channel Mana (+1) |
| Golden Khaganate | The Blood-Song | Each attack by a friendly unit: 1 Mana, at most 5 a round | `effects: add_resource on after_attack, once_per_activation, max_per_round 5` (+ War-Drum aura) -> `combat/cqb.js:294` | Yes | Worked. M16 capped at 5 every round, 20 (all unspent) |
| Grand Duchy of Albion | Lios na Si | Flow of Magic: Tree = end of Movement, 1 Mana per SIDHE unit in FOREST; Attuned: +1 Mana on Channel Mana | `income end_of_movement_phase amount_per_unit 1` (table_active tree, SIDHE, in_terrain forest) + `effects: mod_channel_mana 1` | Yes | Tree paid 0 (no SIDHE in forest, M09/M10/M17); Channel worked (M10 12, M17 5) |
| Great Cossack Host | Black Earth Underfoot | MOUNTED unit's MOVE outside the Movement Phase: 1 Mana, at most 5 a round | `effects: add_resource on move_action_out_of_phase, MOUNTED, max_per_round 5` -> `core/movement/reposition.js:97` | Yes | M15 0: every Riders move came inside the Movement Phase; the Action-Phase offers were declined (AI) |
| **Infernal Congregations** | **Tithe of Torment** | Each time a friendly non-DEMON unit takes HP damage: 1 Mana per 1 HP lost | Was prose only - **no machine block, nothing read it**. Now: `effects: add_resource on hp_lost, target_requires not_tags DEMON, amount {provider event_damage}` -> new `hp_lost` event (`combat/hp_lost_event.js`, emitted by `applyWoundToModel`) | **Was not. Fixed** (commits 938a143a, daec3998) | 0 Mana from it in all seven Infernal battles. Non-DEMON HP lost (units' `totalDmgTaken`, includes overkill): M01 43, M08 105, M11 60, M12 58, M14 64, M18 57, M23 56. Casters starved: Pontifex of Acedia (M01), Stygian Actuary (M08), High Admiral (M12), Lector/Queen Consort (M14), Goetic Ophanim (M23); M11 Sineaters and M18 Murderhost field no caster |
| Iron Imperium | Rituale Romanum | Mana from the Sacrificium rite (Mana = Pietas Tier); Pietas Tier from Acts of Pietas | Rite `rites/sacrificium.json` (add_resource, `pool_tier` provider) + `resource_pools[pietas]` ladder -> `resource_pool_ladders.js` | Yes | Worked. M02 +4, M08 +5. M03/M04/M13/M20/M24 presets have no caster: Pietas climbs, buys nothing |
| Jade Mandate | Dragonvein Invocations | Start of the Command Phase: +2 Mana per MAGIC CASTER on a Dragonvein Node square; **"on multiple nodes ... +2 Mana for each node"** | `income command_phase amount_per_unit 2` (MAGIC_CASTER, in_zone dragonvein_node) -> `runMagicSystemIncome` | Yes, except the multi-node clause (pays once) - see open questions | M23 +2 |
| Kalevan Kansa | Sanan Mahti | Raise Luonto (replaces Channel Mana): 1 APt, not moved this round, Mana = highest of 2D6 | `effects: block_action channel_mana` + `grant_ability raise_luonto` | Yes | M05 0 in all 5 rounds: the Tietaja moved every round, Vainamoinen attacked when it stood still (AI) |
| Kingdom of Hayk | Dragonreaper's Vigil | A Hayk unit spends the QUARRY's VIGIL and the attack hits: 1 Mana | Faction identity `designations[quarry].token.on_spent_hit: add_resource 1` -> `core/designation_tokens.js` | Yes | Worked. M10 +2 (VIGIL), +1 Grogh's Tally, +4 Channel |
| Mat Akkadi | Foundations of Akkad | End of the Action Phase: 1 Mana per Objective Area a Mat Akkadi unit occupies | `income end_of_action_phase amount_per_objective_area 1` -> `runMagicSystemIncome` | Yes | Worked. M14 9 (0 spent) |
| **Panhellenic League** | **The Gods' Portion** | Casters gain SACRIFICE (1 APt, not ENGAGED, not moved this round): 1 Mana for the caster and each other Panhellenic unit within its PER range, max 5, once a round | Was prose only - **no machine block, no ability**. Now: `effects: grant_ability sacrifice` (MAGIC_CASTER) -> `abilities/add_resource/sacrifice.json`, amount `{provider friendly_units_in_area, range 3, same_faction, include_self, max 5}` | **Was not. Fixed** (commit 024a405f) | M13 Mouseion Contingent fields no MAGIC CASTER, so it could not have mattered; no Panhellenic preset carries the Combat Chresmologoi |
| Polish-Lithuanian-Ruthenian Commonwealth | Consecrated Standards | End of the Action Phase: 1 Mana per PRAYING unit | `praying_mana: true` -> `grantPrayingMana` | Yes | Worked (M06 15) but the Oath of Krakow has no MAGIC CASTER: unspendable |
| Principality of Novgorod | The White Host | Start of the Command Phase: 1 Mana per MAGIC CASTER on a square Consumed By Blizzard; Overdraw (1 APt in the storm: 1+1D6 Mana, 1 Absolute Damage) | `income command_phase amount_per_unit 1` (MAGIC_CASTER, in_zone blizzard) + `effects: grant_ability overdraw` | Yes | Worked. M17 +4 White Host, +3 Overdraw, +4 Channel. M05 Opoki Hundred has no caster: 0 |
| Runeforge Directorate | Runecraft | No Mana: Runes are paid in LOOTS (Inscribe) | LOOTS is the faction identity's pool: `gain enemy_model_destroyed 1` -> `awardResourcePoolsForModelKills` (called from `afterModelKilled`) + Plunder, Chancellor of the Nine | Yes (LOOTS) | Worked. M02 32 LOOTS, M12 24 |

## What changed (branch cl-d1-magic)

1. `hp_lost` - a new ability event: every HP a unit loses, whatever took it, reported per wound by
   `applyWoundToModel` with the HP the model really lost, before casualties settle (the killing
   wound counts). `after_damaged` could not be reused: it is enemy damage only, to a unit that
   lives. New amount provider `event_damage` (the HP the answered event took off).
2. Tithe of Torment's machine block: `add_resource` on `hp_lost`, `event_damage` Mana, non-DEMON.
3. SACRIFICE: a new ability granted by The Gods' Portion's machine block; new amount provider
   `friendly_units_in_area` (`adjacent_allies` now reads the same count).

## Evidence after the fix

- **D1-M01 replayed** on the branch build (same presets, map and seed 460703101, no doctrine;
  `output/battle_reports/magic-m01/report.json` in the worktree): the Procession of Ugarit gained
  **39 Mana from TITHE OF TORMENT** (R2 +4, R3 +16, R5 +16, R6 +3; 32 log lines), against 0 on Day 1.
  The battle went to round 6 (A wins 31-27, Day 1: round 5, 31-15).
- **But the Pontifex of Acedia still cast nothing** and ended holding 39 Mana. `canCastRite` answers
  ok for Dark Bolt, Daemonium Meridianum, Gaze of the Abyss and Whisper of Despair with Mana in the
  pool and an enemy 3 squares away (scratch check against the built engine), so the Mana is
  spendable: the AI chose its ranged attack every activation instead. That is an AI rite-scoring
  gap (the same one Day 1 showed for Covenant, Khaganate and Church of the Beast casters, who sat on
  18-29 Mana), not a magic-system one.
- Scratch checks against the built engine: SACRIFICE is granted to the Combat Chresmologoi, pays
  3 Mana for itself and two Hoplites within 3 squares (a third at 4 squares is not counted), is
  refused a second time in the round and after moving; Tithe pays +3 for 3 HP off Cultists, +0 for
  2 HP off Hellkin (DEMON), +20 for a 20-HP Cultist squad wiped by 50 Absolute Damage.

## Rules that cannot trigger on the league map, or look unfinished (for the user)

- **Euskal Herria - Adur** (Mana) and the faction identity **Anboto Fusillade** need ELEVATION 1+.
  CROSSROADS has none, so the faction's Mana engine and identity are dead on the league map (D1-M11).
- **Jade Mandate - multi-node clause.** The text says a caster on several overlapping Dragonvein
  Nodes gains +2 for each node; the engine pays once, and
  `tests/suites/melee_combat/092_jade_dragonvein_nodes.js` pins "once, even where nodes overlap"
  citing a user decision of 2026-09-22 ("text is canon"), as does the mechanics deep-dive. The text
  has said "for each node" since at least 2026-10-05. Left as is: which one is canon?
- **The Gods' Portion - "within its PER range"** is now 3 squares (the Combat Chresmologoi's PER),
  following the 2026-10-12 rule that every ability states its own range; the core-system text was
  changed to say 3. "Once per Battle Round" is read per caster (the default use limit), not
  army-wide (`limit.scope: "army"` would make it army-wide).
- **Tithe of Torment readings.** "Takes HP damage" is read as any source: enemy attacks, statuses,
  plagues, and the army's own costs - Desperate Worship's self-damage and Blood Sacrifice's 1D3
  Absolute Damage now pay Mana (Blood Sacrifice costs 2 and refunds 1-3). Only HP actually lost
  counts (no overkill), the killing wound included. A unit destroyed outright with models still
  standing loses no HP to a wound and pays nothing. The rule rides on the faction's units, so a
  unit that defected to the Infernal player keeps its own faction's rules and does not pay.
- **Rosters that cannot use their Mana at all**: Celeritas Squadron, Blaze of Etna, Protectores
  Divini Lateris (Iron Imperium), Opoki Hundred (Novgorod), Oath of Krakow (Commonwealth),
  Sineaters of Damascus and Murderhost of Halfa (Infernal), Mouseion Contingent (Panhellenic),
  Chonae Wing (Covenant) field no MAGIC CASTER.
- **AI, not engine:** BLF never enters Transitional State (House of Glass pays 0), Kalevan casters
  move instead of Raising Luonto, Cossack Action-Phase moves declined, Nihon casters never channel.
- The mechanics deep-dive said House of Glass pays 2 per Knight; the data and the text say 4.
