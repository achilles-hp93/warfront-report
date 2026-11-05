// Main-thread blocking: old build (page thread), new build forced main, new build worker.
const { spawnSync } = require('child_process');
const path = require('path');
const REPO = '/home/user/warfront/.claude/worktrees/agent-a285210cd9fa4c5ac';
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const P1 = ['iron_imperium/preset:legatus_legion', 'british_liberation_front/preset:merlin_army'];
const P2 = ['empire_of_nihon/preset:taichou_army', 'principality_of_novgorod/preset:rurik_army'];
const runs = [
  ['old build, pair 1', 'out_base', 'main', P1],
  ['new build main, pair 1', 'out_new3', 'main', P1],
  ['new build worker, pair 1', 'out_new3', 'worker', P1],
  ['new build main, pair 2', 'out_new3', 'main', P2],
  ['new build worker, pair 2', 'out_new3', 'worker', P2],
];
for (const [label, out, thread, [a, b]] of runs) {
  const env = Object.assign({}, process.env, { CHROME_PATH: '/opt/pw-browsers/chromium', WARFRONT_OUTPUT_DIR: path.join(S, out) });
  const r = spawnSync('node', [path.join(S, 'tools/probe_blocking.cjs'), REPO, thread, '1', a, b, '99'], { cwd: REPO, env, encoding: 'utf8', timeout: 1200000 });
  console.log('=== ' + label + ' (exit ' + r.status + ')');
  console.log((r.stdout || '').split('\n').filter(l => !/^  round/.test(l)).join('\n'));
  if (r.status !== 0) console.log((r.stderr || '').slice(-1500));
}
