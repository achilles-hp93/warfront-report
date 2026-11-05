# Champion League Day 1 - the AI and identity audit

Day 1 of the Champion League (WARFRONT, Divine Empires: 1899) is played: 24 battles, every
army a preset, both seats the game's own AI, CROSSROADS map, no doctrine. Each battle has a
written report. The user read them and says the reports UNDER-report the AI's mistakes:
"there is a lot more AI issue than what you are reporting". Your job is to go through your
battles round by round, unit by unit, and find every weird or wasteful thing the AI did, and
how each army's faction identity, subfaction identity, add-on identity and magic performed.

Repository: /home/user/warfront (read only - do not edit anything in it, do not commit).
Every command needs
`WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out`.
Battle folders: `$WARFRONT_OUTPUT_DIR/battle_reports/cl-s1-d1-d1-mNN/` (report.json, commentary.json
= the written report, fallbacks.json, effects.json).

Tools (run from the repo):
- `node scripts/battle_report/digest.cjs <name>` - the battle round by round; `--log` adds every log line.
- `node scripts/battle_report/effects.cjs <name> --uses` - every command, ability, spell, Miracle, Antiphon and what it bought.
- `node scripts/battle_report/passives.cjs <name>` - what each passive rule and identity changed.
- `node scripts/battle_report/fallback.cjs <name>` - Fall Back decisions (KNOWN: it also logs AI charge-planning
  probes; an entry whose engagers were never adjacent is a probe, ignore it).
- Unit, ability, faction and magic data: `data/editions/fantasy/` (units/, abilities/, factions/<faction>/[<subfaction>/],
  magic/<faction>/, preset_armies/). Read the rule text before judging a use.

## What to look for - be exhaustive, and be concrete

For every battle, every round, every unit that did something odd or nothing:
- Movement: walking off an objective it held (alone or decisively); pulling back from a fight its side was winning or
  contesting; leaving a friend alone on an objective it could have piled into; darting around with no purpose (moves
  undone, back-and-forth); not taking a free or uncontested objective in reach; losing line of sight to the target it
  was shooting; a melee unit that never charges; a gun that never shoots; idle expensive units.
- Fall Back: needless Fall Backs (no real danger), Fall Back tests with poor odds (needing a 6), giving up objective VP.
- Charges: failed charges and why; charges into fights it cannot win; charges off objectives.
- Shooting and melee: target choice (a PRECISION weapon should prefer a unit with a valuable CHARACTER attached; overkill;
  shooting a weak target while a scoring/threatening one is in reach).
- Commands: Double Time, Scouting Order, Secure Objective, Countercharge, Rally Cry, Troop Requisition, and HQ commands a
  secondary needs (COMMAND AUTHORITY needs an HQ command on a unit in the enemy half) - spent for nothing, on the wrong
  unit, or not spent when a mission needed it.
- Abilities: marks or rerolls no attack used (e.g. Called To Account), buffs on units that did not act, abilities never
  used though available.
- Magic: casters idle, Mana banked and never spent, which spells/Antiphons/Miracles were cast and which never were, poor
  targets (e.g. Miracle of Retribution on a weak-melee unit, Fortitude on a unit that hardly matters), Miracles unspent at
  the end of the battle.
- Missions: secondaries kept that the army cannot do, Raise the Standard placement and play, Primary choices.
- Last round play: when the battle is about to end (this round's scoring decides it, or it is the final round), the AI
  must take guaranteed VP over survival - a unit that falls back off an objective to avoid dying gives up the VP for a
  future that does not exist.
- Special movers: Transitional State / tunnelling (Coblynau Sappers), transports, deep strike - used to take objectives or
  the enemy HQ, or wasted.

User-flagged examples (check them in your battles and find the same kind elsewhere):
M01 Hellkin breaking away in the last round and giving up the 2 VP that won; M02 the left wing - the Chiron Battle Tank and
Equites Igniferi pulling back in Round 2 and leaving the Legionnaires alone on the objective, the Equites darting around;
M08 the Bailiffs' Raise the Standard (placed in its corner, a heavy hitter walks to it for 1 VP and walks off), Round 3
walk-off from the flank, Called To Account rerolls no attack used, COMMAND AUTHORITY's Double Times in its own half; M09
the Coblynau Sappers never tunnelling onto an objective or the HQ and a free objective on the right; M13 Argyraspides 1
attempting a Fall Back that needed a 6, the Palatine units passive while Custos could charge a flank; Covenant Miracles
used haphazardly.

## Identity and magic, per side per battle

For each army: its faction identity, subfaction identity, add-on identity (factions/... json), and its magic system
(Mana pool, Miracles, Antiphons, rites): did each trigger, how often, what it gained (VP, damage, HP, moves - the passives
and effects records), and any gap (never triggered, cannot trigger with this army, resource gathered and never spent,
wrong target, a rule that looks unimplemented).

## Output

Write `/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-day1/audit/<your range>.md`:
- a short cross-battle summary of the patterns at the top;
- per battle: `## D1-MNN A vs B`, then `### AI issues` - one bullet each: round, phase, unit, what it did, what it should
  have done, the evidence (a quoted digest/log line), and the cost (VP lost, unit lost, resource wasted, or minor);
  then `### Identity and magic` - per side, per rule: triggered N times, gained X, gap.
Return the cross-battle summary and the path. Only report what the record shows; quote the line.
