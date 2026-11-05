const fs = require('fs'); const path = require('path');
const { summarize } = require('/home/user/warfront/scripts/battle_report/summarize.cjs');
for (const dir of process.argv.slice(2)) {
  const games = fs.readdirSync(path.join(dir, 'games')).filter(f => /^game-\d+\.json$/.test(f)).sort();
  let inUnitRounds = 0, onUnitRounds = 0, roundsWithAny = 0, rounds = 0, gainSum = 0, gainN = 0, jadeWins = 0;
  const dms = [];
  console.log('==', dir.split('/').slice(-3).join('/'));
  for (const g of games) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'games', g)));
    const s = summarize(r);
    const jade = (r.meta.factions || []).indexOf('jade_mandate');
    if (s.result.winner === jade) jadeWins++;
    const snaps = ((r.formations || {}).snapshots || []).filter(x => x.player === jade);
    snaps.forEach(x => { rounds++; onUnitRounds += x.onBoard; const n = x.formations.reduce((t, f) => t + f.units.length, 0); inUnitRounds += n; if (n) roundsWithAny++; });
    ((r.formations || {}).attacks || []).forEach(a => { gainSum += a.gain || 0; gainN++; });
    ((r.aiPerf || {}).decisions || []).filter(d => d.player === jade && d.phase === 'MOVEMENT').forEach(d => dms.push(d.ms));
    console.log(g, 'R' + s.result.round, s.result.vp.join('-'), 'jade', jade, 'winner', s.result.winner, 'formation rounds', snaps.map(x => x.formations.map(f => f.id.split('_')[0] + ':' + f.units.length).join('+') || '-').join(' '));
  }
  dms.sort((a, b) => a - b);
  const q = p => dms.length ? dms[Math.floor(p * (dms.length - 1))].toFixed(0) : '-';
  console.log(`Jade wins ${jadeWins}/${games.length}; unit-rounds in formation ${inUnitRounds}/${onUnitRounds} (${(100 * inUnitRounds / Math.max(1, onUnitRounds)).toFixed(1)}%); rounds with one ${roundsWithAny}/${rounds}; attacks touched ${gainN}, gain ${gainSum.toFixed(1)}; Jade movement decision ms median ${q(0.5)} p90 ${q(0.9)} max ${q(1)} (n ${dms.length})`);
}
