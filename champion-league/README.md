# Champion League Season 1, Day 1: the raw evidence and the scripts

Everything the Day 1 AI work was measured with, so the next agent can compare a new build against
it without replaying or rewriting a tool. The narrative (rulings, the four check runs and their
measures, root-cause analyses, open items) lives in the game repo, `doc/ai/champion-league/` on
`main` of `achilles-hp93/warfront`; start there. This folder is the data and code behind it.

Champion League Season 1: 48 presets, Day 1 = 24 battles on CROSSROADS, league seed 460653000, the
same draw and seeds every time. A seed repeats a battle exactly on the engine that played it; a
newer engine diverges at its first changed decision, so compare totals, not single battles.

## The runs (`season1-day1/<run>/`)

| Folder | What it is | Build (game repo) |
|---|---|---|
| `cl-out/archive_day1_v1/` | the first play of Day 1, before the Day 1 fixes | before PR #90 |
| `cl-out/` | the official league: Day 1 replayed after the Day 1 fixes | PRs #90-#91 |
| `cl-shadow/` | check run 1: Day 1 AI command and objective fixes | `edb131b2` |
| `cl-shadow2/` | check run 2: idle-analysis bug fixes | `9f66b27a` |
| `cl-shadow3/` | check run 3: round 4 (threshold caps, MS table, ADVANCE pricing, objective horizon, formation pull, held-ground margin) | `651d146a` |
| `cl-shadow4/` | check run 4: blunder fixes, walk fixes, Reaction pricing | `c8506c47` |

Each run holds `tournaments/cl-s1/{state.json,day-1.txt}` (results, seeds, armies) and
`battle_reports/cl-s1-d1-d1-mNN/` with `report.json.xz` (the full record: every move, combat,
decision, with the board snapshots the tools read), `effects.json`, and for the official run also
`fallbacks.json` and `commentary.json`. `report.json` is xz-compressed (about 1.5 MB instead of 4 MB);
`xz -dk` restores it byte for byte.

## Quick start

```
./unpack.sh /tmp/cl-work --rs <game repo checkout at the build under test> --link-original-path
python3 /tmp/cl-work/cmp/agg.py cl-shadow3 cl-shadow4        # the comparison table of check-runs.md
cd <game repo> && node scripts/battle_report/digest.cjs /tmp/cl-work/cl-shadow4/battle_reports/cl-s1-d1-d1-m06/report.json
```

`unpack.sh` recreates the layout the scripts were written for (the original scratchpad), with the
records decompressed. `--link-original-path` symlinks it where many scripts hard-code it
(`/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad`); `--rs` points the probe
runners at a checkout of the build you want to test (they load `rs/scripts/battle_report/record.cjs`,
and need that checkout's `node_modules`).

To play a new check run, see "Reproducing a check run" in the game repo's
`doc/ai/champion-league/README.md` (about 45 minutes for 24 battles), then compare with `agg.py`.

## What is here

- `season1-day1/cmp/` - the comparison: `agg.py` (idle unit-rounds, commands that bought nothing,
  margins, draws, same-winner count; run it on two runs), the digest (`<run>-dig-mNN.txt`) and
  commands-and-abilities (`<run>-eff-mNN.txt`) text of every battle of every run, `so_check.cjs`
  (Secure Objective uses against objective presence).
- `season1-day1/audit/` - the Day 1 audit and balance material (`cl-day1/`: per-battle audits,
  balance analysis, army and elite studies, magic systems, map choice) and the replay problem
  reports (`cl-day1r/`), plus `idle_rca_report.txt`, the idle-unit root-cause report.
- `tools/<area>/` - probes and measurement scripts, one folder per work area of the session:
  `idle-tools` (idle-unit probes), `aiact-tools` (ADVANCE / charge / push choice), `aibugs-tools`,
  `aicmd-tools` (CP purchases, objective holding), `aimove-tools` (movement and charge scoring),
  `blunders-tools` (blunder audit and the negative-proof method, `prove.sh`), `react-tools`
  (Reaction pricing, Overwatch at chargers, divergence finder), `rules4-tools` / `rules5-tools` /
  `small5-tools` (rules fixes and their browser checks), `wt-report-tools` (battle-report tool
  changes), `rulesrec` (joined CHARACTER shots after its pair charged), `tools` (earlier general
  analysis scripts), `root-scripts` (one-off scripts of the whole session, e.g. `kpis.cjs`,
  `cmp_batch.cjs`).
- `briefs/` - the briefs the fix, audit and commentary agents were given: conventions for worktrees,
  build directories, tests, fingerprints and commits. Reuse them for the next round.
- `token-cost/` - the scripts of the token-cost analysis (see its README).
- `task-history/` - the session's 235 tasks (subject, status, description), archived before the
  completed ones were cleared from the live list.

## Read before relying on a script

They are scratch tools written during the work, not maintained code. Each starts with a comment
saying what it does and how it is called; the ones in `cmp/` and the `react-tools`,
`blunders-tools`, `idle-tools` probes were used for several runs, the rest for one question. Many
hard-code the scratchpad path (hence `--link-original-path`); some name a worktree that no longer
exists (`REPO = .../worktrees/agent-...`): set it to your checkout. Copies of the game repo's own
`scripts/` that the probe runners carried (`rs/`) are not stored: the game repo is the one source
of truth for that code.
