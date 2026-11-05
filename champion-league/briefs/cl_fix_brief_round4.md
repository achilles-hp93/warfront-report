# Champion League Day 1 check run: the user's rulings, round 4 (shared brief)

You are one of three agents applying the user's rulings on the Day 1 check-run findings.
The other two work in their own worktrees on separate areas (rules, data and the
battle-report recorder; AI unit actions; AI objectives and positioning). Work only inside
your own scope.

The user's rulings, verbatim (binding; quoted in full so you can read your item in context):
> 1. Ms table
> 2. Wow why are you still asking this? I thought there is a rule about threshold characteristics ???????? Threshold characteristic is capped at +-1 modifier if they are 1d6. AP does not count as modifer of DEF so it can go as it likes.
> 3. Hm ok   [approves weighting each enemy's threat toward the units nearest it, 1/distance^2, in the survival estimate]
> 4. Hmm advancing is not idle, but a unit that only advance is a problem too. It lost out on shooting usually. We need to price whether an advance is justified, i.e does it end on an objective area, is it provide better position for this round and the next,etc. Overwatch is considered a free action. So no mentioned restriction. Oh i didnt realize the Bastion cannot be charged. Hmm Gatekeeper of Babylon should have a differe t effect, how about adjacent friendly unit gain +1 to their save roll?
> 5. Recommended ai fixes: approve
> 6. Keep it per unit.   [the Charge's +3 INI stays per unit: no change]

Earlier the user ruled "bugs found must be fixed". The analysis behind the AI items is
`S/idle_rca_report.txt` (it cites file:line for every cause). The bug fixes it named are
already merged at 9f66b27a: a charge at a joined pair asks its squad; the Round 1 push gives
way to a better charge; aiUnitCanStillAct asks the attack rules; a pair's CHARGE locks its
CHARACTER's ranged weapons; the idle recorder ignores rounds a unit acted in or had no APt.

## Where things are
- S = `/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad`.
- You work in your own git worktree of the WARFRONT repo, on a branch made from
  `ccr-6962c382-ne55kb` at 9f66b27a (check `git log -1`; if the worktree started elsewhere,
  create your branch from 9f66b27a). Read `.claude/CLAUDE.md` first and follow it: one source
  of truth (no copies - reuse existing helpers, never hand-write a second one), small files,
  register new battle state, no bespoke ability handlers.
- The worktree has no `server/node_modules`; if a tool needs it, symlink
  `/home/user/warfront/server/node_modules` into it and never commit the link.
- Build into YOUR OWN output dir: `export WARFRONT_OUTPUT_DIR=S/wt-<your-name>-out` then
  `python generate_game.py` (about 10 minutes). Browser: `export CHROME_PATH=/opt/pw-browsers/chromium`.
- Unit tests: `node scripts/run_unit_tests.cjs --skip-build [--test "<exact test name>"]`.
  Full gate before you finish: `node scripts/run_all_tests.cjs --skip-build --phase 2.5`,
  `--phase 3`, `--phase 4b`, and `node scripts/run_browser_smoke.cjs --skip-build`.
- Newest evidence: a Day 1 check run played on 9f66b27a itself, records in
  `S/cl-shadow2/battle_reports/cl-s1-d1-d1-mNN/report.json`, read with
  `WARFRONT_OUTPUT_DIR=S/cl-shadow2 node scripts/battle_report/digest.cjs cl-s1-d1-d1-mNN [--log]`
  and `... effects.cjs cl-s1-d1-d1-mNN`. `S/cl-shadow2/warfront-fantasy.html` IS that build:
  a battle replayed from its seed with WARFRONT_OUTPUT_DIR pointing at a dir of symlinks to
  that folder's warfront-fantasy.html, warfront-engine.js, assets, icons, reference and
  3d_asset reproduces the record exactly - use that to read the AI's own numbers on recorded
  boards, and your own build to show your change. Seeds and sides:
  `S/cl-shadow2/tournaments/cl-s1/state.json` (map CROSSROADS). To replay one battle:
  `node scripts/battle_report/record.cjs --a <faction>/<formation> --b <faction>/<formation> --seed <seed> --map CROSSROADS --name <your-prefix>-mNN`
  (about a minute a round). The first check run (older build) is `S/cl-shadow/` in the same
  layout; the idle analysis's probe tools are in `S/idle-tools/`. Never write into
  `S/cl-shadow`, `S/cl-shadow2` or `S/cl-out`.
- Disk is shared (about 13 GB free for three agents): keep one build dir, delete scratch
  recordings you no longer need.

## House rules for the change
- Find the ROOT CAUSE / the owning code with file:line before changing anything.
- Tests (CLAUDE.md "Tests Must Test Unique Code"): add a test only for new code or a bug fix,
  prefer extending an existing test of the same code, and prove each new test FAILS without
  its change (patch it out of the built `warfront-fantasy.html` - the engine appears in it
  TWICE, patch both - or rebuild without it, run the test, show the failure, put it back).
  No per-record tests; data edits need no test.
- Fingerprint tests `tests/suites/rules_refactor/417_*`, `430_*`, `443_*` pin AI/estimate
  numbers. If a deliberate change of yours moves one, recapture it with a dated comment
  (2026-10-30, round 4) saying what moved it, and prove only your change moved it. Report old
  and new hashes: they are recaptured again when the three branches are merged.
- Rules text: when you change a rule's behaviour, make its source text say the same
  (`doc/editions/fantasy/` markdown sources, data `desc`, `doc/shared-fantasy-mechanics-deep-dive.md`).
  Do NOT commit regenerated generated docs (`doc/**/*.html`, the glossary).
- AI weights: new weights go where the existing ones live (aiW / the AI weight data), not as
  literals; document what each new term is for in the code comment, with the battle that
  showed the problem.
- Commit on your worktree branch with clear messages ending with these two lines, and do NOT
  push or open a PR:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Csi7Q66Y74mhVBGcnqnUNM
  ```
  Never put a model name or ID anywhere else in a commit.

## Your final report (plain text, for the integrating session)
For each item: what you found (file:line), what you changed, the test and the proof it fails
without the change, and the evidence on real boards (a replayed Day 1 battle on your build,
or the AI's numbers on a recorded board). Then: fingerprints moved (old/new), the full gate's
results, your branch name and commit hashes, and anything you found but left alone. If an
item needs a rules decision the user has not made, say so plainly instead of guessing.
