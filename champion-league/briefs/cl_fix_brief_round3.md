# Champion League Day 1 check run: bug fixes found by the idle-unit analysis (shared brief)

You are one of two agents fixing bugs the idle-unit root-cause analysis found in the Day 1
check run. The other agent works in its own worktree on a separate area (AI decision bugs;
or a rules bug plus a battle-report recorder bug). Work only inside your own scope. The
user has a standing rule: "bugs found must be fixed". Only the bugs listed in your own brief
are approved; the AI VALUATION changes the analysis also proposed (pricing the CHARACTER's
lost shot on an ADVANCE, no value for objectives beyond the rounds left, the formation
term, a margin before leaving held ground) are NOT approved yet - do not make them.

## Where things are
- S = `/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad`.
- The analysis that found these bugs: `S/idle_rca_report.txt` (read it first; it cites
  file:line for every cause). Its probe tools are in `S/idle-tools/`, its per-match output in
  `S/idle-out/`, digests in `S/idle/mNN.txt`.
- You work in your own git worktree of the WARFRONT repo, branched from
  `ccr-6962c382-ne55kb` at 81d6bb72. Read `.claude/CLAUDE.md` first and follow it: one source
  of truth (no copies), small files, register new battle state, no bespoke ability handlers.
- The worktree has no `server/node_modules`; if a tool needs it, symlink
  `/home/user/warfront/server/node_modules` into it and never commit the link.
- Build into YOUR OWN output dir:
  `export WARFRONT_OUTPUT_DIR=S/wt-<your-name>-out` then `python generate_game.py`
  (about 10 minutes). Browser: `export CHROME_PATH=/opt/pw-browsers/chromium`.
- Unit tests: `node scripts/run_unit_tests.cjs --skip-build [--test "<exact test name>"]`.
  Full gate before you finish: `node scripts/run_all_tests.cjs --skip-build --phase 2.5`,
  `--phase 3`, `--phase 4b`, and `node scripts/run_browser_smoke.cjs --skip-build`.
- Evidence: the check run's 24 records are in
  `S/cl-shadow/battle_reports/cl-s1-d1-d1-mNN/report.json`. Read one as text with
  `WARFRONT_OUTPUT_DIR=S/cl-shadow node scripts/battle_report/digest.cjs cl-s1-d1-d1-mNN [--log]`.
  `S/cl-shadow/tournaments/cl-s1/state.json` lists every match (a, b, seed, map CROSSROADS).
  To replay one battle on your build:
  `node scripts/battle_report/record.cjs --a <faction>/<formation> --b <faction>/<formation> --seed <seed> --map CROSSROADS --name <your-prefix>-mNN`
  (it writes under your own WARFRONT_OUTPUT_DIR; about a minute a round). Do not write into
  `S/cl-shadow` or `S/cl-out`.
- Disk is shared (about 12 GB free): keep one build dir, delete scratch recordings you no
  longer need.

## House rules for the change
- Find the ROOT CAUSE with file:line before changing anything; fix it there.
- Tests (CLAUDE.md "Tests Must Test Unique Code"): add a test only for new code or a bug fix,
  prefer extending an existing test of the same code, and prove each new test FAILS without
  its fix (patch the fix out of the built `warfront-fantasy.html` - the engine appears in it
  TWICE, patch both - or rebuild without it, run the test, show the failure, put it back).
  No per-record tests.
- Fingerprint tests `tests/suites/rules_refactor/417_*`, `430_*`, `443_*` pin AI/estimate
  numbers. If a deliberate change of yours moves one, recapture it with a dated comment
  (2026-10-30) saying what moved it, and prove only your change moved it (with the change
  patched out the old hash comes back). Report old and new hashes: they will be recaptured
  again when the two branches are merged.
- Rules text: when you change a rule's behaviour, make sure its source doc text says the same
  (`doc/editions/fantasy/` markdown sources, `doc/shared-fantasy-mechanics-deep-dive.md`).
  Do NOT commit regenerated generated docs (`doc/**/*.html`, the glossary).
- Commit on your worktree branch with clear messages ending with these two lines, and do
  NOT push or open a PR:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Csi7Q66Y74mhVBGcnqnUNM
  ```
  Never put a model name or ID anywhere else in a commit.

## Your final report (plain text, for the integrating session)
For each item: what was wrong (root cause, file:line), what you changed, the test and the
proof it fails without the fix, and the evidence the real case is fixed (a replayed battle's
lines, or why a replay could not show it). Then: fingerprints moved (old/new), the full
gate's results, your branch name and commit hashes, and anything you found but left alone.
If an item turns out not to be a bug, or the fix needs a rules decision the user has not
made, say so plainly instead of guessing.
