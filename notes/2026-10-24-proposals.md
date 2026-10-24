# Proposals - 2026-10-24 (afternoon)

Answers to the open decisions of the overnight note. Nothing below is implemented yet
unless it says so.

## 4. AI problems the reports found

### Healing abilities are never used (a bug, six units)
Six targeted heals declare `ai_role: { SUPPORT }`, and the Action Phase ability scorer
(`ai/action/ability_scoring.js`) has no SUPPORT branch: only a `HEAL` role prices a heal. They
score 0 and are never used. In the batches: Theriac Surgery (Asklepian Medic) 0 uses in 6
battles, Mechanical Repair (Heron) 0, Battlefield Baptism (Jordanite Hospitaller) 0 in the 6
Penitent Crusade battles. The others: Profane Surgery (Ashen Chirurgeon), Three Bright Birds
(Cliodhna), Vetustate Conlapsum (Artificer Captain).
Fix: price a heal by its effects, whatever its role label - the shared `heal` pricing in
`ai/effect_value.js` (HP it can mend x the unit's worth), as the MOBILITY branch already prices
a move order by its effect.

### Idle heavy melee: two causes
61 of the 62 idle rounds of the Oni Samurai, the Taichou and the Armored Gashadokuro were
"nothing in reach", not a choice to hold. Two things put them there.

**The walk stops short.** In 16 of the Oni Samurai's idle rounds it walked without charging and
ended its own move 2 to 4 squares from the nearest enemy; the Gashadokuro did the same in 10.
The enemy was not running away: it usually came closer after. The Rynda Guard (MOVE 2) ended 4
to 9 squares away. Before proposing a fix I want to probe one of these boards (Caliphate vs
Nihon, game 1, Round 2) and read the destination score's terms for the Oni, to see which term
holds it back: a charge that was out of reach, the danger terms, or the objective pull.

**The target walks away.** Of 282 charges in the five batches, 57 (20 percent) ended with the
target Falling Back later in the same Movement Phase, so the charger had nothing to fight in the
Action Phase. The Oni Samurai: 5 of 10 charges. The Rynda Guard: 5 of 9. A unit that Falls Back
leaves even when it fails its test (it takes the disorder damage and goes).
Fix options for this one:
- A. Discount a charge on an enemy that still moves this phase by the chance it leaves (the
  enemy's own Fall Back weighing, or its Fall Back test chance as a floor), so a charge on a unit
  that has already moved, or one pinned in place, is preferred.
- B. Order the moves: with Priority, the AI moves its heavy melee after the units it would charge
  have moved, when it can.
- A and B together. A is the smaller change and works without Priority.

### Forest of Fangs (+1 AP to melee weapons this round)
The rite's buff branch (`_aiScoreRiteOnUnit`) values every friendly buff the same way - the
target's worth x 0.45, full if an enemy is within 6 - without reading the effect. So a melee buff
went 6 times on the Marrowstring Centaur, a shooter, and only 3 of 15 targets fought in melee.
Fix: price a friendly rite by its effects (the shared `mod_weapon` pricing), and make that
pricing read the effect's `scope.type`: a melee-weapon buff is worth something only on a unit
that will fight in melee while it lasts (engaged now with APt left, or able to charge before it
expires).

### Blessing of Sacred Rabies
Checked: the forced attack is free. It does not spend the target's APt
(`combat/compelled_attacks.js`), and its own player picks the victim, so it hits the Church unit
beside it. The AI prices the spell as a flat debuff (the target's threat x 0.5) and never counts
the free attack it hands the enemy.
Fix: price it as SUPPRESSED (OC 0 where it stands on an objective, -1 to HIT, no Overwatch, until
it rallies) minus the expected damage of the free attack on the unit the enemy will pick - and
plus that damage when the only units it can reach are its own side.

### Gatescrolls of Avalon
The AI's value for entering TRANSITIONAL STATE (`abilities/ops/enter_transitional_state.js`) is
(1 - HP ratio) x 10 + (distance to the nearest enemy - 5): a healthy squad standing 8 squares
from any enemy clears the spend's minimum of 2. Leaving at the end of the Movement Phase also
gives up that round's attacks and its scoring, and the value counts neither. That is the
squad that left every round from 2 to 5.
Fix: price leaving as the danger it escapes (the enemies' expected damage on it before it could
act again, the same estimate the objective survival term uses) minus what it gives up (the
objective VP it holds or contests at this round's scoring, its best attack this round).

### Matter Transmutation (found by the record fix)
The AI coated Muqatila Troopers 1's rifles in four rounds running, and the squad fought only in
melee in those rounds: the four coatings changed nothing. The AI's plan
(`weaponTagSpendAiPlan`) values an option by `ai_value` x the weapon's attacks, without asking
whether the unit will fire that weapon.
Fix: value a coating only on a weapon the unit is expected to fire (not engaged, a target in
range), and prefer a unit not already coated.

## 5. Support units: what they add besides damage

Heron is a buffer, but mostly for MACHINE units. His kit: Calibrated Torsion (+1 RANGE to
League MACHINE units in Command Range), Scholarch of the Akademeia (+1 BS to League units that
have not moved), Mechanical Repair (heals a MACHINE D3) and Thaumata (sets an Omen Die).

Measured per battle (Runeforge vs League, 6 battles):
- Heron: dealt 0.3 HP. Scholarch +0.5 expected HP to friendly attacks. Calibrated Torsion not
  measured (the record does not yet price a RANGE change). Mechanical Repair and Thaumata never
  used (the heal is the bug above; Thaumata has no AI pricing).
- Asklepian Medic: dealt 0, healed 0. Theriac Surgery never used (the bug above). Its
  Enkoimeterion Watch heals the squad it is attached to, and my Heron's Army preset left it
  unattached - fixed: it now leads League Hoplite 2.
- Heliostat Battery: dealt 2.0; Blinding Flash 1.3 uses, nothing priced. Tripod: dealt 1.8.

A support metric, per unit, from what the record already holds:
- **HP added**: expected HP its abilities, spells and passives added to friendly attacks, with
  minus without (the rules' own estimate).
- **HP kept off**: expected HP its effects kept off friendly units.
- **HP healed**: by its abilities and by its passives.
- **Attacks enabled**: attacks only it made possible (a SPOTTED target), and their expected HP.
- **Objective VP decided** by its effects (an OC change).
Shown beside "VP per 100 RP" as a "support per 100 RP" line. To add for it: pricing a RANGE buff
(Calibrated Torsion: attacks only in range because of it), and heals done by passives
(Enkoimeterion Watch).

## 7. Speed

Profiles of 12 battles (2261 s of page busy time):
- Weapon profiles, 19 percent: `Weapons.profile` 420 s total, `_applyCombatProfile` 271 s,
  `_cloneCombatUnit` 78 s self. Each call copies the combat unit to build one weapon's profile.
  Keep a resolved profile for the reading, as the Stats answers now are.
- Drawing the page, about 16 percent: `drawBoard` 180 s, `_unitListRow` 112 s self,
  `renderUnitCard` 60 s, objective markers 11 s, the faction panel 12 s. The page redraws after
  every AI action. Redraw once per animation frame, and only the rows whose unit changed.
- Combat effects, 7 percent: `collectCombatEffects` 168 s total walks every registered effect
  for every hook. File them by hook and domain when they register.
- Ability lookups, about 5 percent: `_findAbilityById` 110 s total (identity keys computed per
  call). Index a unit's abilities once, or keep the answer for the reading.
- Responsiveness: yield to the browser between AI decisions so the page paints and takes input
  while the AI plays. A Web Worker is a much bigger change: the engine runs on globals and the DOM.

Each step is proved as before: the timed battles replay identically, combat logs compared line by
line, and the time is measured.
