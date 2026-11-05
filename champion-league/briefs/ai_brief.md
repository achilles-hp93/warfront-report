# Champion League Day 1 - fixing the AI

Read /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/impl_preamble.md
first and follow it (house rules, tests, commits, no push). Then read this.

The user watched Day 1 (24 AI-vs-AI battles, both seats the game's own AI) and said:
"We need better smarter AI behavior... The AI doesn't have to make optimal moves but it cannot make
stupid super wrong mistakes" - and "there is a lot more AI issue than what you are reporting".
Four auditors then went through every battle. Their findings, round by round, with the quoted
record lines, are in
/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-day1/audit/m01-m06.md,
m07-m12.md, m13-m18.md, m19-m24.md (read all four for your scope), and the balance analysis is in
.../cl-day1/balance.md (context: ~80% of VP is positional; objectives decide battles).

The user's own words on the AI (binding):
- "Last Round" behaviour: in the Mihran Spah match (D1-M01), at the last round the Hellkin broke
  away because of the expected VP the opponent could score from killing it, but gave up the left
  objective for a guaranteed 2 VP which won the game. "In the supposed Last Round, expectation
  doesn't matter, because you won't survive the next round anyway. If it had stayed there was a
  chance to last another round; when it leaves, that chance is 0."
- "The AI is a bit too skittish now: afraid to get close, afraid to get into good shooting angles,
  falls back all the time. Maybe they see something I don't?" - find out what it sees, and fix what
  is wrong in it.
- D1-M02 (Armoured Cohort vs Magdeburg Warhost), Round 1-2 left wing: only one Black Huskarls and
  the Chiron tank + Equites Igniferi near it; in Round 2 the tank and the Equites both pulled back,
  leaving the Legionnaires alone after they had moved in to contest the objective. "If they had piled
  in instead, that objective could have been won even if the Legionnaires had been killed. It's
  especially bad with the Equites because its job is to charge into stuff and kill them in melee.
  The tank is also bad: even if it prefers to shoot and the Black Huskarls has already engaged, it
  can totally get into the objective area in case the Legionnaires are destroyed; instead it pulled
  back, lost optics on the Black Huskarls, could not shoot and wasted a turn. It's a 40 RP unit, it
  cannot make a mistake like this." The Equites were "darting around doing nothing".
- The Covenant's Miracles are used haphazardly: "Miracle of Retribution on Covenant Levies with
  shitty melee is a waste, or Fortitude to save some weak unit that hardly matters. Ideally it should
  spend all its Miracles before the game ends though."
- "Looks like a lot of the Introit Antiphon is being used? What about other Antiphons?"
- Raise the Standard (D1-M08 Bailiffs): "it places the Standard in its corner, uses one of its heavy
  hitters to walk to it, scores a measly 1 point, then spends another round walking out of it, doing
  nothing. Also in Round 3 why does it walk off the flank and give up a potential 2 VP for literally
  nothing?" "The Master of Coin's Called To Account marked Ironthunder Vanguard 1 for rerolls that no
  attack used -> not acceptable." "COMMAND AUTHORITY needed an HQ Command on a unit in the enemy half,
  and its Double Times went to units in its own half???"
- Coblynau Sappers (D1-M09) have only Transitional State and poor stats; the AI never used their
  tunnelling to take an objective or the enemy HQ, which is what such a crappy frontline unit is
  for - and there was a free objective on the right the whole battle.
- D1-M13: Argyraspides 1 attempted a Fall Back that needed a 6 - why? The Palatine units were
  passive; the Palatine Custos could charge and kill something on either flank.
- "Do units with PRECISION weapons prioritise a unit with a high-value CHARACTER attached? They should."

Rules changing at the same time in other branches (your code must agree with them once merged):
a player scores at most 10 VP per Battle Round (a helper will tell how much VP a player can still
score this round - if you need it before it is merged, write your code against a small function of
your own named in your report, and I will join them); a joined CHARACTER + squad counts as ONE unit
for every count; Take Ground is not allowed while Engaged; FREE weapons in Overwatch now fire.

How to work:
- Find the cause in the AI code (engine/modules/ai/**; doc/shared-fantasy-mechanics-deep-dive.md for
  the rules) before changing anything; fix the cause generically (a valuation, a missing term, a
  wrong estimate), not a special case for one unit or one battle. Never a bespoke rule per unit name.
- Measure. A battle replays exactly from its seed (sides and seeds:
  /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/tournaments/cl-s1/state.json,
  days[0].matches[i]: .a/.b {faction, formation}, .seed). Build into your own output dir
  (`WARFRONT_OUTPUT_DIR=<scratchpad>/<your-name>-out python generate_game.py`) and replay with
  `WARFRONT_OUTPUT_DIR=<same> CHROME_PATH=/opt/pw-browsers/chromium node scripts/battle_report/record.cjs --a <faction>/<formation> --b <faction>/<formation> --seed <seed> --map CROSSROADS --no-doctrine --no-images --name <name>`
  then `digest.cjs <name>` to see what the AI now does in the same situation. Use at most ONE browser
  at a time (the machine is shared). For a change that is broad, play a small before/after set of
  the battles that showed it and report the numbers (objective VP held, idle units, wasted CP,
  units lost).
- Keep the AI fast: no new per-square full searches; reuse the cached readings.
- Report: branch, commits, what each fixes (with the battle that showed it), the before/after
  evidence, and what you looked at and left alone (with why).
