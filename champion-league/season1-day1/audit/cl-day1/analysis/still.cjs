'use strict';
// Ranged attacks by units that had / had not moved earlier that Battle Round, and their damage.
const fs = require('fs'), path = require('path');
const { enrichCombats } = require('/home/user/warfront/scripts/battle_report/page/enrich.cjs');
const R = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/battle_reports';
const g = { moved: { n: 0, dmg: 0 }, still: { n: 0, dmg: 0 } };
fs.readdirSync(R).filter(d => d.startsWith('cl-s1-d1-d1-m')).forEach(dir => {
  const r = JSON.parse(fs.readFileSync(path.join(R, dir, 'report.json'), 'utf8'));
  enrichCombats(r);
  r.combats.filter(c => c.kind === 'ranged' && c.phase === 'ACTION' && c.attacker && !c.friendlyFire).forEach(c => {
    const moved = r.moves.some(m => m.round === c.round && (m.uid === c.attacker.uid || m.partner === c.attacker.name) && m.seq < c.seq);
    const k = moved ? 'moved' : 'still';
    g[k].n++; g[k].dmg += (c.losses || []).filter(l => l.player !== c.attacker.player).reduce((s, l) => s + (l.lost || 0), 0);
  });
});
console.log(g, 'dmg/attack moved', (g.moved.dmg / g.moved.n).toFixed(2), 'still', (g.still.dmg / g.still.n).toFixed(2));
