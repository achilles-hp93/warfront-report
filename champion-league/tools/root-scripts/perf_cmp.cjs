const fs = require('fs'), path = require('path');
const rows = [];
for (const [build, name] of process.argv.slice(2).map(a => a.split(':'))) {
  const dir = path.join(build, 'battle_reports', name, 'games');
  if (!fs.existsSync(dir)) continue;
  const games = fs.readdirSync(dir).filter(f => /^game-\d+\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  let rounds = 0, aiMs = 0, wall = 0, act = [], phase = {};
  games.forEach(g => {
    rounds += g.result.round || 0;
    const ds = (g.aiPerf && g.aiPerf.decisions) || [];
    ds.forEach(d => { aiMs += d.ms; (phase[d.phase] = phase[d.phase] || []).push(d.ms); if (d.phase === 'ACTION') act.push(d.ms); });
    const s = (g.perf && g.perf.samples) || []; wall += s.length ? s[s.length - 1].at : 0;
  });
  const q = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
  const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  rows.push({ build, name, games: games.length, rounds, 'wall s/round': (wall / 1000 / rounds).toFixed(1), 'AI s/round': (aiMs / 1000 / rounds).toFixed(1),
    'Action decision mean ms': mean(act).toFixed(0), 'p90': q(act, 0.9).toFixed(0), 'max': Math.max(0, ...act).toFixed(0),
    'Movement mean ms': mean(phase.MOVEMENT || []).toFixed(0), 'Command mean ms': mean(phase.COMMAND || []).toFixed(0) });
}
console.table(rows);
