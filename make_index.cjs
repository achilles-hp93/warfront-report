// index.json and README.md for warfront-report, from its report folders.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const R = '/home/user/warfront-report', GAME = '/home/user/warfront';
const PAGE = id => 'https://claude.ai/artifact/' + id;
const PAGES = {
  'legion-vs-host': ['Battle of the Acropolis', 'EQ7pJueWSw1gGvjPu77Y8t'],
  'cohort-vs-crusade': ['Battle of the Acropolis: Cohort vs Crusade', 'VyCJWEMzCdmdaTiLqozJuM'],
  'cohort-vs-crusade-2': ['Acropolis Rematch: Cohort vs Crusade, with casters', '1D9Yk8jjKveLWpccTh9UBc'],
  'fallback-legion': ['Fall Back Review', 'C9Jdu9KfNknjEyNnqTX9YN'], 'fallback-cohort': ['Fall Back Review', 'C9Jdu9KfNknjEyNnqTX9YN'],
  'host-vs-court': ['Crossroads: Spahbed\'s Host vs the Veiled Court', 'LzvebqZr6fybPXGpciUvwd'],
  'khaganate-vs-novgorod': ['Triple Hills: Genghis against Rurik', 'NXrh2W2mka4DH6CXmZdcDy'],
  'duat-vs-albion': ['Crossroads: Finvarra against Ramesses', 'RLynL31c6nu6aXkuKnkyfc'],
  'blf-vs-beast': ['Acropolis: Merlin against the Herald', '16hHQ4PZKtzqhvuUjgW3tp'],
  'caliphate-vs-nihon': ['Acropolis: Saladin against the Taichou', '3TVdATu56KW4YcqKztE7Hn'],
  'runeforge-vs-league': ['Acropolis: Hakon against Heron', 'BaqM4RyoPmPY6qPS8AfA15'],
  'host-vs-court-fix': ['WARFRONT AI Performance', 'NUodFsFrhCaAN4Rx3w38ku'], 'cohort-vs-procession-fix': ['WARFRONT AI Performance', 'NUodFsFrhCaAN4Rx3w38ku'],
};
const NOTES = {
  'legion-vs-host': 'First batch and featured battle; the report that led to the Troop Requisition, Aswaran, gun team, scout and secondary-mission fixes.',
  'legion-vs-host-after': 'Same seeds after those fixes (first pass).', 'legion-vs-host-after2': 'Same seeds, second pass of the AI retune.', 'legion-vs-host-after3': 'Same seeds, third pass.',
  'cohort-vs-crusade': 'Armoured Cohort vs Crusade Host: live featured battle and its batch.', 'cohort-vs-crusade-2': 'The rematch with casters in both armies: live battle and batch.',
  'fallback-legion': 'Fall Back review: Legion vs Host battles judged decision by decision.', 'fallback-cohort': 'Fall Back review: Cohort vs Crusade battles.',
  'cohort-vs-procession-final2': 'Cohort vs Procession, 12 seeds (700-711) with the whole first round of AI fixes in (the "final engine" measurement).',
  'cohort-vs-procession-fixed': 'Same seeds after the first AI fixes (move orders, set_ap, banking Mana, toggles, stand-still bonus, missives, kept far square).',
  'cohort-vs-procession-missive': 'Same seeds with the planner following the missive (reverted at the user\'s call).',
  'cohort-vs-procession-stepart': 'Same seeds after the first step-back rule and artillery fire support.',
  'cohort-vs-procession-sb8': 'Same seeds after the step-back rule\'s fix (margin 8).',
  'cohort-vs-procession-dmg': 'Same seeds with artillery positioned by damage (the Morphean Engine got worse).',
  'cohort-vs-procession-fix': 'Same seeds after the three fixes of 2026-10-24: objective holding, charge floor, fire support does not screen.',
  'cohort-vs-procession-ai': 'Partial batch (1 battle).', 'cohort-vs-procession-final': 'Empty: a batch cut short.',
  'host-vs-court': 'Spahbed\'s Host vs Veiled Court: 12-battle batch and the live featured battle (seed 806, Crossroads).',
  'host-vs-court-fix': 'Same seeds (800-811) after the three fixes of 2026-10-24.',
  'perf-smoke': 'Seed 802 replayed with the AI timing recorder: same result as its batch battle.',
  'repro-700': 'Seed 700 replayed to check a battle repeats.', 'charge-check': 'One battle to check a charge fix.',
  'whispers-check': 'Seed 811 replayed to check the Whispers of Forbidden Pleasure pricing.',
  'khaganate-vs-novgorod': 'First battles of the Baljuna Khaganate and the Principality of Novgorod (new presets): 6-battle batch and the featured battle (seed 1012).',
  'duat-vs-albion': 'First battles of the Duat Dominion and the Grand Duchy of Albion (new presets): 6-battle batch and the featured battle (seed 1001).',
  'blf-vs-beast': 'First battles of the British Liberation Front and the Church of the Beast (new presets): 6-battle batch and the featured battle (seed 1034).',
  'caliphate-vs-nihon': 'First battles of the Caliphate of the Two Sanctuaries and the Empire of Nihon (new presets): 6-battle batch and the featured battle (seed 1024).',
  'runeforge-vs-league': 'First battles of the Runeforge Directorate and the Panhellenic League (new presets): 6-battle batch and the featured battle (seed 1044).',
  'survival-hvc-before': 'Host vs Court, seeds 960-965, before survival-weighted objectives (the baseline).',
  'survival-hvc-fullsum': 'Same seeds with the first cut of survival-weighted objectives: every enemy counted in full on every unit (replaced).',
  'survival-hvc-shared': 'Same seeds with survival-weighted objectives, the whole risk counted: each enemy\'s attack shared among the units it can reach (tuned to 0.7 of the risk).',
  'survival-hvc-w5': 'Same seeds, 0.5 of the survival risk counted (tuning trial).',
  'survival-hvc-w7': 'Same seeds, 0.7 of the survival risk counted: the weight committed (cfa91403).',
  'survival-pvc-w5': 'Penitent vs Court, same seeds, 0.5 of the survival risk counted (tuning trial).',
  'survival-pvc-w7': 'Penitent vs Court, same seeds, 0.7 of the survival risk counted: the weight committed.',
  'survival-pvc-before': 'Penitent vs Court, seeds 970-975, before survival-weighted objectives (the baseline).',
  'survival-pvc-shared': 'Same seeds with survival-weighted objectives, the whole risk counted.', 'smoke-live': 'Live-mode smoke test.', 'trial': 'The battle-report tool\'s first trial battle.',
};
const out = [];
for (const name of fs.readdirSync(path.join(R, 'reports')).sort()) {
  const dir = path.join(R, 'reports', name);
  const games = fs.existsSync(path.join(dir, 'games')) ? fs.readdirSync(path.join(dir, 'games')).filter(f => /^game-\d+\.json$/.test(f)) : [];
  const files = [fs.existsSync(path.join(dir, 'report.json')) && path.join(dir, 'report.json')].concat(games.map(g => path.join(dir, 'games', g))).filter(Boolean);
  const metas = files.map(f => { try { const r = JSON.parse(fs.readFileSync(f, 'utf8')); return { meta: r.meta || {}, result: r.result || {}, perf: !!r.aiPerf }; } catch (e) { return null; } }).filter(Boolean);
  const first = metas[0] || { meta: {} };
  const times = metas.map(m => m.meta.recordedAt).filter(Boolean).sort();
  const at = times[times.length - 1] || null;
  let engine = null;
  if (at) { try { engine = execSync(`git log --all --before="${at}" -1 --format="%h %s"`, { cwd: GAME, encoding: 'utf8' }).trim(); } catch (e) {} }
  let results = null;
  if (fs.existsSync(path.join(dir, 'batch.json'))) {
    const b = JSON.parse(fs.readFileSync(path.join(dir, 'batch.json'), 'utf8'));
    const w = [0, 0]; let n = 0; (b.games || []).forEach(g => { if (!g) return; n++; if (g.winner === 0 || g.winner === 1) w[g.winner]++; });
    results = { battles: n, wins: w, armies: (b.armies || []).map(a => a.name) };
  } else if (metas.length === 1 && first.result) {
    results = { battles: 1, winner: first.result.winner != null ? (first.meta.armyNames || [])[first.result.winner] : null, vp: first.result.vp, round: first.result.round };
  }
  const page = PAGES[name] || (/^perf-/.test(name) ? ['WARFRONT AI Performance', 'NUodFsFrhCaAN4Rx3w38ku'] : null);
  out.push({
    name, armies: first.meta.armyNames || null, maps: [...new Set(metas.map(m => m.meta.map).filter(Boolean))],
    battles: metas.length, recorded: times.length ? [times[0], at] : null, engine,
    timed: metas.some(m => m.perf), lean: metas.some(m => m.meta.lean),
    results, page: page ? { title: page[0], url: PAGE(page[1]) } : null,
    files: fs.readdirSync(dir).sort(), note: NOTES[name] || (/^perf-/.test(name) ? 'AI timing battles (--lean --profile) for the AI performance report.' : ''),
  });
}
fs.writeFileSync(path.join(R, 'index.json'), JSON.stringify(out, null, 1));
const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|');
const rows = out.map(e => {
  const res = !e.results ? '' : e.results.wins ? `${e.results.armies[0]} ${e.results.wins[0]}–${e.results.wins[1]} ${e.results.armies[1]}` : (e.results.winner ? `${e.results.winner} ${(e.results.vp || []).join('–')} (R${e.results.round})` : '');
  return `| [${e.name}](reports/${e.name}/) | ${esc((e.armies || []).join(' vs '))} | ${e.battles} | ${esc(e.maps.join(', '))} | ${e.recorded ? e.recorded[1].slice(0, 10) : ''} | ${esc(res)} | ${e.engine ? '`' + e.engine.split(' ')[0] + '`' : ''} | ${e.page ? `[${esc(e.page.title)}](${e.page.url})` : ''} | ${esc(e.note)} |`;
});
const readme = `# WARFRONT reports

The raw records behind WARFRONT's battle reports and AI analyses: AI-vs-AI battles played in the built game
by the battle-report tool (\`scripts/battle_report/\` in the game repo), the batches they came from, the probes
that explained them, and the AI performance study. The report pages themselves are claude.ai artifacts,
linked below; the records here are what rebuilds them, and what a later batch is compared against.

## What is here

- \`reports/<name>/\` - one folder per report, as the tool writes it under \`<output dir>/battle_reports/<name>/\`:
  - \`report.json\` - a single recorded battle (the featured one, with board images).
  - \`games/game-<n>.json\` - each battle of a batch, by seed; \`batch.json\` - the batch's numbers by army.
  - \`commentary.json\`, \`battle_report.html\` - the report's text and its built page; \`live/\` - a live report's round documents.
  - \`fallbacks.json\`, \`effects.json\` - extracts made for an analysis.
- \`ai-performance/2026-10-24/\` - the AI performance study: its datasets, the dashboard page, and the scripts that made them from \`reports/perf-*\`, \`reports/host-vs-court-fix\` and \`reports/cohort-vs-procession-fix\`.
- \`probes/2026-10-23/\` - AI probe replays (what each unit's AI scored, its missives, charge squares) and the probe scripts.
- \`probes/2026-10-24/\` - survival-weighted objectives: each unit's Round 1 objective survival under the first cut and the committed version (seed 960), the Assassin's moves on seed 950, and the probe scripts.
- \`notes/\` - open decisions left for the user.
- \`research/\` - background research (morale, fatigue and battle weariness in other games).
- \`index.json\` - this table, machine-readable.

A seed repeats a battle exactly on the engine that played it: \`engine\` is the game repo's last commit before
the recording (\`git log --all --before=<recordedAt> -1\`), close to but not proof of the build used.

## Adding a report

Copy the folder from \`<output dir>/battle_reports/<name>/\` into \`reports/\`, add its note and page to
\`index.json\` (or re-run the index script), and commit.

## Reports

| Folder | Armies | Battles | Maps | Recorded | Result | Engine | Page | Note |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

## Pages whose records are not here

Recorded in an earlier container and lost with it; only the page remains.

- [Immortals vs Crusade Ledger](${PAGE('GHVPf4NMMyuDmtpuSwf6zf')}) (2026-10-22)
- [Flamebringer vs Penitent](${PAGE('WeziEYb2dY73SDZc3e8boQ')}) (2026-10-22)
- [Cohort vs Procession](${PAGE('RSvAJ4yjbJwfYbetqy6UAH')}) (2026-10-22): its featured battle; the same seeds' later batches are in \`reports/cohort-vs-procession-*\`.

The pages are private to their owner's claude.ai account until shared.
`;
fs.writeFileSync(path.join(R, 'README.md'), readme);
fs.copyFileSync(__filename, path.join(R, 'make_index.cjs'));
console.log(out.length, 'reports indexed');
