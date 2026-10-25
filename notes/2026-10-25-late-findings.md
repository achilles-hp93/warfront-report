# Findings, 2026-10-25 (late)

From eleven batches of 6 battles on the day's last builds: `taichou-vs-rurik` (twice),
`genghis-vs-penitent`, `procession-vs-heron`, `legion-vs-merlin`, `valkyrie-vs-ramesses`,
`vanilla-vs-ramesses` (the Valkyrie preset with `"doctrineId": "none"`, a local preset not committed),
and one batch for each of five cults' presets: `hegemon-vs-saladin`, `plague-vs-finvarra`,
`dawnking-vs-herald`, `admiral-vs-crusade`, `chairman-vs-cohort`.

## Fixed (game repo)

- **Blinding Flash bought nothing in 6 of 6 uses.** It was priced as a flat debuff on the target's worth.
  A penalty to an enemy's HIT rolls is now worth the damage it stops this round (`53ecd240`).
- **Secure Objective bought, then the unit Fell Back.** +OC is now worth nothing on an engaged unit whose
  Fall Back check says it will leave (`53ecd240`).
- **Runeforge Loots.** Plunder, Hostile Takeover, Liquidate Assets and Inscribe are now priced by what
  their Loots buy and hold up, and the record sees round marks and weapon surges (agent work, `a95dcde8`).
- **Yata no Kagami counted each attacker once per enemy it marked.** In seed 1234, round 2, it read 16
  with four attackers counted on three enemies. Each attacker now counts once, on the enemy it would
  attack (`169afa9b`).
- **Name the Omen: "no change" in 8 of 8 uses.** The record had no face-dice support. It now records the
  die turned and counts a later spend only that die could pay for. The AI buys it only when a doubled die
  can become a missing face (`42bb966a`).
- **Yasakani no Magatama went on Ashigaru that had nothing in sight**, round 1 of all 6 battles. A shot
  before moving now needs an enemy the army can see: SPOTTED, or within a friend's PER of where it can
  move (`f24895e5`).
- **A joined pair's ground.** The objective score counted only the moving unit's OC, and the "can it
  leave" check removed only its OC. Both now count the CHARACTER too (`1bd7e0ab`).
- **Merlin died in all 6 Legion battles**, 4 of them to the Legatus. He joins the Parish Militia
  (Chaff 0.95), so the pair weighed danger as chaff. A footprint is now as expendable as its least
  expendable member (`5baa4b59`).

## Measured

- **Troop Requisition (bands 3/5/7 CP):**
  - Overall: about 0.85 requisitions per side per game.
  - Armies with 10-RP troops: 2.0 to 2.2 per game, all at 3 CP (Genghis 13 in 6, Penitent 12, Procession
    8). Units requisitioned: Tamga-Bound, Covenant Levies and Cultist Troopers.
  - Armies without them: Ashigaru (15 RP) and Parish Militia (13 RP) at 5 CP, 0.5 to 0.8 per game.
  - Rurik, Heron and the Legion: none at all.
  - No unit over 20 RP was ever requisitioned.
- **Regalia after `f24895e5`** (`taichou-vs-rurik` again, Nihon 5 to 1):
  - Kusanagi no Tsurugi 3 strikes, 35.2 expected HP, about 11.7 a strike.
  - Yata no Kagami 27 uses, 115.9 HP, 21 paid off: about 4.3 a use. Per Regalia that is 3.9 for
    Kusanagi against 4.3 for the Mirror.
  - Yasakani no Magatama still went on Ashigaru in round 1 in 3 of 6 battles, buying nothing there.
- **Merlin after `5baa4b59`** (`legion-vs-merlin`, 3 to 3, was 2 to 4): Merlin survived 1 of 6 (was 0 of
  6) and mostly died later (rounds 5 to 7). The Legatus still reaches him.
- **Regalia before the sight rule:**
  - Kusanagi no Tsurugi was never used. Yata no Kagami was spent every Command Phase: 33 uses, 89.7
    expected HP, 21 of 33 paid off. Yasakani no Magatama was used only in round 1.
  - By the rules' own estimate, the buffed Mirror is worth 5 to 16 a use against Kusanagi's 3.5 to 6.3,
    at a third of the cost, so the save-for-Kusanagi rule never holds the bar.
- **Encroaching Winter:**
  - About 2.7 CHILLED unit-rounds a game, none before round 3, almost all on Nihon's back-line shooters
    (Ashigaru, War Onmyoji).
  - The round-6 morale part rarely applies: battles end in rounds 4 to 7.
- **Oversoul:** Ramesses made 1 Oversoul cast in 23 (an Endless Procession at 6 Mana, raising Tomb
  Fusiliers).
- **Runeforge** lost 0 to 6 to Ramesses, both with and without The Gilded Ledger:
  - With the Ledger: 20.5 VP to 32.5 a game, 86 RP lost to 27. Plunder 29 uses (+65 Loots), Hostile
    Takeover 11 (+33), Inscribe 6, Liquidate Assets 0. The Loots pile up unspent.
  - Without a doctrine: 22.2 VP to 35.3, 95 RP lost to 39. Plunder 10, Inscribe 6 (4 bought nothing).
  - Shieldmaidens survived 0 of 6. Odin's Einherjar now score 5.05 VP a copy.
- **Genghis** lost 0 to 6 to the Penitent Crusade:
  - Objectives 5 to 16 against 16 to 22. Damage is about even.
  - Genghis charges with his Khesig Guards as a pair, survived all 6 battles, and took 0 to 9 HP. The
    pair (105 RP) dealt only 7 to 20 HP a battle.
- **Cult presets:**

  | Preset | Opponent | Result | Avg VP | RP lost per game |
  |---|---|---|---|---|
  | Sloth (Procession) | Heron | 4-2 | | |
  | Pestilence (Plague Monarch) | Finvarra | 4-0 | | |
  | Wrath (Hegemon) | Saladin | 2-4 | | |
  | Greed (Chairman) | Armoured Cohort | 2-4 | | |
  | Dawn King | Herald | 1-5 | | 90 to 32 |
  | High Admiral | Crusade Host | 0-6 | 12.8 to 34.7 | 88 to 18 |

  The two missing Plague Monarch games died on a page timeout while builds ran beside the batch. Replayed
  alone, seed 1282 plays to the end on both builds: not a hang.
- **Firelance Druzhina** reversed its move from the round before once in 23 moves (6 battles). The
  back-and-forth is gone.

## Open (for the user)

- **Kusanagi against the Mirror:** a cost or effect change, or a hard save rule.
- **Gilded Ledger:** the thresholds arrive late and spending drops them.
- **Requisition:** 3 CP for a 10-RP squad sits at the top of the 1-2 target for armies with such squads.
  Presets are still about 200 RP under the 250 cap.
- **Weak cult presets:** High Admiral and Dawn King.
