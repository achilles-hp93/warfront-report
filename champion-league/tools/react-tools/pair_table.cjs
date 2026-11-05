// Base vs mine for each replayed battle: node pair_table.cjs mNN...
const fs = require('fs'), path = require('path'), cp = require('child_process');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const sum = f => JSON.parse(cp.execFileSync('node', [path.join(__dirname, 'probe_sum.cjs'), f], { encoding: 'utf8' }));
const rows = [];
const tot = { base: {}, mine: {} };
const keys = ['declared', 'landed', 'failed', 'intoOverwatchReady', 'intoCounterchargeable', 'intoFaec', 'overwatchAtChargers', 'overwatchDmgToChargers',
  'faecShots', 'faecDmg', 'counterchargesMade', 'counterchargesCanceled', 'aiMs', 'decisionsMs', 'movementMs', 'fallBackMs', 'movePhaseDecMs', 'chargeDecMs'];
for (const m of process.argv.slice(2)) {
  const b = path.join(S, 'react-base/battle_reports/react-base-' + m + '/report.json');
  const n = path.join(S, 'wt-react-out2/battle_reports/react-mine-' + m + '/report.json');
  if (!fs.existsSync(b) || !fs.existsSync(n)) { console.log(m, 'missing'); continue; }
  const B = sum(b), N = sum(n);
  const rounds = f => JSON.parse(fs.readFileSync(f, 'utf8')).result.round;
  console.log(m, 'result base', JSON.stringify(B.result), 'mine', JSON.stringify(N.result));
  console.log('   ' + keys.map(k => k + ' ' + B[k] + '/' + N[k]).join(', '));
  console.log('   timing base', JSON.stringify(Object.keys(B).filter(k => k.startsWith('t:')).reduce((o, k) => (o[k] = B[k], o), {})));
  console.log('   timing mine', JSON.stringify(Object.keys(N).filter(k => k.startsWith('t:')).reduce((o, k) => (o[k] = N[k], o), {})));
  console.log('   aiMs per round base ' + Math.round(B.aiMs / rounds(b)) + ' mine ' + Math.round(N.aiMs / rounds(n)));
  keys.forEach(k => { tot.base[k] = (tot.base[k] || 0) + B[k]; tot.mine[k] = (tot.mine[k] || 0) + N[k]; });
  tot.base.rounds = (tot.base.rounds || 0) + rounds(b); tot.mine.rounds = (tot.mine.rounds || 0) + rounds(n);
}
console.log('TOTAL base', JSON.stringify(tot.base));
console.log('TOTAL mine', JSON.stringify(tot.mine));
