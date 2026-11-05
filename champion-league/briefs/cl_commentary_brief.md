# Champion League Season 1 - writing the battle reports for a Day

You are writing the full battle report for some league battles of the Champion League,
Season 1 of WARFRONT (Divine Empires: 1899): every preset army in the game, 48 of them,
in one league. Each battle was played by the game's own AI on both seats, on the
CROSSROADS map, with no doctrine. The battles are already recorded; your job is the
words, then the page.

Repository: /home/user/warfront (work from there). Every command needs
`WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out`.

Read first: `.claude/skills/battle-report/SKILL.md` - the sections "commentary.json",
"Writing it" and "Checks before publishing". That file is the house standard for a
report; follow it.

## For each battle you are given (a folder name like `cl-s1-d1-d1-m03`)

1. Read the battle: `node scripts/battle_report/digest.cjs <name>` (add `--log` only if you
   need a detail the digest leaves out). The folder is
   `$WARFRONT_OUTPUT_DIR/battle_reports/<name>/` and holds `report.json`.
2. Write `$WARFRONT_OUTPUT_DIR/battle_reports/<name>/commentary.json` with:
   - `title`: "<army A> vs <army B>" (the preset names).
   - `armies`: `[{name, faction}, {name, faction}]`, Player A first.
   - `mode_name`: the mission mode the digest names.
   - `lede`: two sentences: who won, by how much, and the one thing that decided it.
   - `result_line`: e.g. "Horns of Hattin win 18-11 on Victory Points in Battle Round 6".
   - `deployment`: how each side set up and what that set up.
   - `rounds`: one entry for EVERY Battle Round played, each with a `title` (a headline) and
     a `feed` of the phases that mattered (`{phase, text}`): who moved where and why it
     mattered, the decisive fights with numbers, CP and Mana spent and on what, missions
     scored or lost. Name units as the game does.
   - `analysis`: `{title: "Why it went this way", html}` - where the VP came from on each
     side (objectives, Primary, secondaries), what each army's key units did (the scoring,
     activity and commands-and-abilities records are in the digest), and what the loser
     could not do. Separate the AI from the army: say when a result looks like an AI
     choice (an idle unit, a wasted command, a bad Fall Back) rather than the army's
     strength. You may place `{{chart:attrition}}`, `{{chart:rp-trade}}`,
     `{{chart:objectives}}`. Do NOT use `{{batch}}` or `batch-*` charts: there is no batch.
   - `closing_title`, `closing`: a short close.
   Text is trusted HTML you write: escape anything quoted from data. Keep unit and rule
   names exact. Analyst's voice, no lore prose. Every number must match the digest.
3. Build the page:
   `node scripts/battle_report/build.cjs <name> --standalone --out /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-day1r/reports/<match id lowercased>.html`
   (e.g. `.../cl-day1r/reports/d1-m03.html`). Fix commentary.json until it builds.
4. Check: the page's VP, CP and kills agree with the digest; `report.errors` in
   report.json is empty (if not, say so).

## What to send back

For every battle, in this exact shape (the Day page is built from it):

```
### <match id> <army A> vs <army B>
Result: <winner> <vp A>-<vp B>, round <n>, <reason>
Summary: <two or three sentences for the Day page: how it was won>
Suspected problems: <bugs or AI mistakes you saw, each with the round, the unit and the
digest or log line that shows it; "none" if none>
Built: <path of the html file and its size>
```

Only report a problem you can point to in the record. Do not edit anything in the
repository other than the commentary.json files; do not commit.

## What is new in these battles (Day 1 replayed)

These are the Day 1 battles played again on the same draw and seeds, after the fixes the
user asked for. The first playing is archived: its records are in
`$WARFRONT_OUTPUT_DIR/archive_day1_v1/cl-s1-d1-d1-mNN/` (read one with
`node scripts/battle_report/digest.cjs $WARFRONT_OUTPUT_DIR/archive_day1_v1/cl-s1-d1-d1-mNN/report.json`).
In each report's analysis, add one short paragraph headed "Against the first playing":
the first result, and what changed between the two (only what the two records show).

What changed since the first playing, so you can name it where it shows:
- **Rules:** a player scores at most 10 VP per Battle Round from all sources ("VP CAP" log
  lines); a joined CHARACTER and its squad count as one unit for every count; a mission of
  duration N lasts N rounds; GARRISON DUTY is broken by counterattacks and Overwatch; TAKE
  GROUND is refused while Engaged and may end adjacent to an enemy without a charge; an AOE
  attack makes no Friendly Fire roll (friends in the blast are still attacked); a MOVE 0
  unit gains no MOVE (Introit cannot move an HQ); Tithe of Torment pays Infernal armies 1
  Mana per HP a non-DEMON unit loses (at most 10 a round); Panhellenic casters have
  SACRIFICE; Atavistic Rage no longer costs OC; FREE weapons now fire in Overwatch.
- **Units and presets:** EPIC HERO characters cost 10 RP less; Palatine Custos, Custos
  (Mounted), Palatine Artillerists, Consecrated Hussars and Khassakiyya Guard have OC 2 a
  model; dedicated guns are cheaper; the Legionnaire Squad is BS 3+; Palatine Custos carry a
  Helios Pistol. 36 presets changed (casters added to Chonae Wing, Popinjay Guild, Belfry
  Battery, Oath of Krakow and Cappadocian Riders; OC squads to Protectores, Celeritas, Blaze
  of Etna and Horns of Hattin; the rest topped up toward 250 RP).
- **AI:** commands, Miracles, Antiphons and Mana are priced by what they change; PRECISION
  prefers a valuable CHARACTER; an enemy's threat is shared among the units it can reach
  (the AI was "afraid to get close"); the last round values guaranteed VP over survival;
  units step into Objective Areas instead of stopping short; granted moves weigh the
  formation they break; the kill bonus is weighed by the chance of the kill.
- **Report tools:** the Fall Back record holds real decisions only; CP, Mana and canceled
  charges count as gains; effect damage is credited to its source; friendly fire is kept
  out of damage dealt; a second unit of one name gets a "#2". The old "known record
  issues" are fixed: do not repeat them.
