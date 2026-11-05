// Day 1 check run: joined CHARACTERs idle in Round 1 after their pair's ADVANCE.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const rows = [];
for (let i = 1; i <= 24; i++) {
  const nn = String(i).padStart(2, '0');
  const r = JSON.parse(fs.readFileSync(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${nn}/report.json`, 'utf8'));
  const armies = (r.meta.armies || []).flat();
  armies.filter(u => u.character && u.joined).forEach(u => {
    const pairMove = r.moves.find(m => m.round === 1 && m.phase === 'MOVEMENT' && m.partner === u.name && m.player === u.player);
    const idle = r.activity.find(a => a.round === 1 && a.uid === u.uid && a.kind === 'idle');
    const acted = r.activity.filter(a => a.round === 1 && a.uid === u.uid && a.kind !== 'idle' && a.kind !== 'objective').map(a => a.kind);
    rows.push({ m: nn, name: u.name, rp: u.rp, tags: (u.tags || []).join(','), pairAdvanced: !!(pairMove && pairMove.advanced), idleR1: !!idle, acted: acted.join(',') });
  });
}
rows.forEach(x => console.log(`M${x.m} ${x.name} (${x.rp}) pairAdvanced=${x.pairAdvanced} idleR1=${x.idleR1} acted=${x.acted} [${x.tags}]`));
console.log('joined CHARACTERs', rows.length, 'pair advanced in R1', rows.filter(x => x.pairAdvanced).length, 'of which idle', rows.filter(x => x.pairAdvanced && x.idleR1).length);
