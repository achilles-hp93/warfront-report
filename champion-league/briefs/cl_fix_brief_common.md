# Champion League Day 1 replay: fixes before Day 2 (shared brief)

You are one of four agents fixing what the Day 1 replay of the Champion League found. The
user reviewed the findings and ruled on them; their rulings are quoted in your own brief and
are binding. Work only inside your scope: three other agents are fixing other areas in their
own worktrees at the same time (rules/engine bugs; battle-report tools; command and
objective-holding AI; combat AI).

## Where things are
- You work in your own git worktree of the WARFRONT repo (branch made from
  `ccr-6962c382-ne55kb` at 7748bd69). Read `.claude/CLAUDE.md` first and follow it: one source
  of truth (no copies), small files, register new battle state, no bespoke ability handlers.
- Build into YOUR OWN output dir so you never collide with the others or the main tree:
  `export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/wt-<your-name>-out`
  then `python generate_game.py`. Browser: `export CHROME_PATH=/opt/pw-browsers/chromium`.
- Unit tests: `node scripts/run_unit_tests.cjs --skip-build [--test "<name substring>"]`.
  Full gate before you finish: `node scripts/run_all_tests.cjs --skip-build --phase 2.5`,
  `--phase 3`, `--phase 4b`, and `node scripts/run_browser_smoke.cjs --skip-build`.
- Evidence: the Day 1 replay's 24 records are in
  `S/cl-out/battle_reports/cl-s1-d1-d1-mNN/report.json` (S = the scratchpad path above
  without `/wt-...`). Read one as text with
  `WARFRONT_OUTPUT_DIR=S/cl-out node scripts/battle_report/digest.cjs cl-s1-d1-d1-mNN [--log]`.
  The commentary writers' problem notes are in `S/cl-day1r/agent_reports/*-problems.md`.
  Each record holds its two sides, seed and map; `S/cl-out/tournaments/cl-s1/state.json`
  lists every match (a, b, seed, map CROSSROADS). To replay one battle on your build:
  `node scripts/battle_report/record.cjs --a <faction>/<formation> --b <faction>/<formation> --seed <seed> --map CROSSROADS --name <your-prefix>-mNN`
  (it writes under your own WARFRONT_OUTPUT_DIR). A battle takes about a minute a round.
  Do not write into `S/cl-out`.
- Disk is shared and tight (about 13 GB free for four agents): keep one build dir, delete
  scratch recordings you no longer need.

## House rules for the change
- Find the ROOT CAUSE with file:line before changing anything; fix it there.
- Tests (CLAUDE.md "Tests Must Test Unique Code"): add a test only for new code or a bug fix,
  and prove each new test FAILS without its fix (patch the fix out of the built
  `warfront-fantasy.html`, or rebuild without it, run the test, show the failure, put it
  back). No per-record tests.
- Fingerprint tests `tests/suites/rules_refactor/417_*`, `430_*`, `443_*` pin AI/estimate
  numbers. If a deliberate change of yours moves one, recapture it with a dated comment
  (2026-10-29) saying what moved it, and prove only your change moved it (with the change
  patched out the old hash comes back). Report old and new hashes: they will be recaptured
  again when the four branches are merged.
- Rules text: when you change a rule, update its source doc text (the data `desc`/rule
  text and `doc/editions/fantasy/` markdown sources, `doc/shared-fantasy-mechanics-deep-dive.md`
  where it describes the mechanic). Do NOT commit regenerated generated docs
  (`doc/**/*.html`, the glossary): they are regenerated once at integration.
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
