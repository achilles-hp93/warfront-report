// Play each seeded battle with the AI on the page thread and in the worker, then compare.
// usage: node identity_runs.cjs <repo> <outdir> <seeds,comma> [lean]
const { spawnSync } = require('child_process');
const path = require('path');
const [repo, out, seedsArg, leanArg] = process.argv.slice(2);
const seeds = seedsArg.split(',').map(Number);
const pairs = [
  ['iron_imperium/preset:legatus_legion', 'british_liberation_front/preset:merlin_army', 'legion-merlin'],
  ['empire_of_nihon/preset:taichou_army', 'principality_of_novgorod/preset:rurik_army', 'taichou-rurik'],
];
const env = Object.assign({}, process.env, { CHROME_PATH: '/opt/pw-browsers/chromium', WARFRONT_OUTPUT_DIR: out });
const results = [];
for (const [a, b, tag] of pairs) {
  for (const seed of seeds) {
    const names = {};
    for (const thread of ['main', 'worker']) {
      const name = `id-${tag}-s${seed}-${thread}`;
      names[thread] = name;
      const args = ['scripts/battle_report/record.cjs', '--a', a, '--b', b, '--seed', String(seed), '--map', 'ACROPOLIS',
        '--name', name, '--no-images', '--ai-thread', thread];
      if (leanArg === 'lean') args.push('--lean');
      if (thread === 'worker') args.push('--ai-verify');
      const t0 = Date.now();
      const r = spawnSync('node', args, { cwd: repo, env, encoding: 'utf8', timeout: 3600000 });
      console.log(`${name}: exit ${r.status} in ${Math.round((Date.now() - t0) / 1000)}s ${(r.stdout || '').split('\n').filter(l => /winner|errors/.test(l)).join(' | ')}`);
      if (r.status !== 0) console.log((r.stderr || '').slice(-2000));
    }
    const cmp = spawnSync('node', [path.join(__dirname, 'compare_reports.cjs'),
      path.join(out, 'battle_reports', names.main, 'report.json'), path.join(out, 'battle_reports', names.worker, 'report.json')], { encoding: 'utf8' });
    console.log(cmp.stdout);
    const w = require(path.join(out, 'battle_reports', names.worker, 'report.json'));
    const m = require(path.join(out, 'battle_reports', names.main, 'report.json'));
    console.log('worker stats', JSON.stringify(w.aiDecisions), 'main stats', JSON.stringify(m.aiDecisions));
    results.push({ tag, seed, identical: cmp.status === 0, workerStats: w.aiDecisions });
  }
}
console.log(JSON.stringify(results, null, 1));
