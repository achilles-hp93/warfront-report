// idle_cmp.cjs <mNN>... - each replay's activity against the Day 1 record it replays: idle
// unit-rounds before and after, the rounds now held, and whether every other entry is the
// same (the same battle).
const SC = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
for (const m of process.argv.slice(2)) {
  const a = require(`${SC}/cl-out/battle_reports/cl-s1-d1-d1-${m}/report.json`);
  const b = require(`${SC}/wt-report-out/battle_reports/rp-${m}/report.json`);
  const key = e => e.round + ':' + e.uid;
  const held = new Set(b.activity.filter(e => e.kind === 'objective').map(key));
  const idle = x => x.activity.filter(e => e.kind === 'idle');
  const rest = (x, drop) => JSON.stringify(x.activity.filter(e => !drop.includes(e.kind)).map(e => [e.round, e.uid, e.kind]));
  console.log(`${m}: result ${a.result.vp.join('/')} R${a.result.round} -> ${b.result.vp.join('/')} R${b.result.round}; idle ${idle(a).length} -> ${idle(b).length};`
    + ` held ${held.size} unit-rounds, ${idle(a).filter(e => held.has(key(e))).length} of them idle before;`
    + ` every other entry the same: ${rest(a, ['idle']) === rest(b, ['idle', 'objective'])}`);
}
