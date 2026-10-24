# AI speed-up, 2026-10-24

The twelve timed battles (six matchups, two seeds each: 900/901, 910/911, 920/921,
930/931, 940/941, 950/951; lean records, CPU profiles on) replayed on the build before
the speed-up and on the build after it, the two side by side on the same machine (4-core
Xeon 2.1 GHz, Chrome 141). Every replay's combat log matched the original battle's line
for line: the AI made the same decisions, only faster. The 61 AI benchmark scenarios
also gave identical answers in every field (17.8 s -> 10.1 s to answer them all).

## The changes (branch `ccr-6962c382-ne55kb`)

| Commit | What |
|---|---|
| 09cbdace | The turn's set-up stops building the threat matrix nobody read (7% of a battle) |
| 71cd4666 | A pass's cached value is aiTargetValue's (a copy had drifted: works); posture reads it |
| 885e0570 | No value asked of a square that hurts nobody (28 s of a 254 s battle); Action order keys read once |
| 3790d270 | Unit list keeps the rows that did not change (60 ms a redraw, ~300 redraws a battle) |
| 5d6658ee | A turn's decision starts from the values its set-up read |
| 6ecc1550 | An estimate keeps a condition's answer while it is read (the Light of Ahura Mazda's ABLAZE check) |
| b8767c8d | Faction panel leaves unchanged markup as it stands (7 ms a redraw, ~670 a battle) |

## AI time per matchup (two battles each)

| Matchup | Before | After | Change |
|---|---|---|---|
| Legion vs Host | 370 s | 145 s | -61% |
| Armoured Cohort vs Crusade Host | 321 s | 161 s | -50% |
| Immortals vs Penitent Crusade | 399 s | 147 s | -63% |
| Armoured Cohort vs Procession | 400 s | 201 s | -50% |
| Spahbed's Host vs Veiled Court | 294 s | 114 s | -61% |
| Penitent Crusade vs Veiled Court | 264 s | 123 s | -53% |
| **All twelve** | **2,048 s** | **891 s** | **-56%** |

## Turns and freezes

| | Before | After |
|---|---|---|
| AI turn, median | 1,371 ms | 563 ms |
| AI turn, 90th percentile | 2,616 ms | 1,076 ms |
| Slowest AI turn | 10.1 s | 4.4 s |
| Command Phase turn, median | 1,621 ms | 715 ms |
| Movement Phase turn, median | 1,687 ms | 724 ms |
| Action Phase turn, median | 842 ms | 366 ms |
| Main-thread time frozen in tasks over 50 ms | 2,601 s | 1,214 s |
| Freezes over 1 s | 986 | 370 |
| Freezes over 3 s | 127 | 2 |
| Longest freeze | 10.5 s | 4.4 s |

The "after" freezes were measured before the faction panel change, which takes a further
~4.7 s a battle off the main thread.

## Stage by stage (AI time, all twelve)

| Build | AI time |
|---|---|
| Before | 2,048 s |
| + threat matrix, cached values, hazard skip, sort keys, unit list | 1,314 s |
| + the turn's readings handed to its decision | 1,059 s |
| + an estimate keeps a condition's answer | 891 s |

## Where the time goes now

The rules engine's estimate of an attack: resolving weapon profiles (each copies the
attacking and defending units, `_cloneCombatUnit`), collecting the combat effects that apply
(every one of 127 registered effects asked each time, by ability name lookups), and aura
scans. The AI's own code is a small share. Rows of the unit list that do change still
re-parse their inline icon images.
