'use strict';
const fs = require('fs'), path = require('path');
const { enrichCombats } = require('/home/user/warfront/scripts/battle_report/page/enrich.cjs');
const R = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/battle_reports';
const G = {};
const W = { winRanged: 0, winMelee: 0, loseRanged: 0, loseMelee: 0 };
fs.readdirSync(R).filter(d => d.startsWith('cl-s1-d1-d1-m')).sort().forEach(dir => {
  const r = JSON.parse(fs.readFileSync(path.join(R, dir, 'report.json'), 'utf8'));
  enrichCombats(r);
  r.combats.forEach(c => {
    let kind = c.kind; if (kind === 'ranged' && c.phase === 'MOVEMENT') kind = 'overwatch';
    if (!c.attacker) kind = /Fall Back/.test(c.label || '') ? 'fallback' : 'effect';
    (c.losses || []).forEach(l => {
      if (l.player == null) return;
      let dealer = 1 - l.player;
      if (c.attacker && c.attacker.player === l.player && kind !== 'melee') return;
      G[c.round] = G[c.round] || {}; G[c.round][kind] = (G[c.round][kind] || 0) + (l.lost || 0);
      const win = r.result.winner === dealer;
      if (kind === 'ranged' || kind === 'overwatch') W[win ? 'winRanged' : 'loseRanged'] += l.lost || 0;
      if (kind === 'melee' || kind === 'fallback') W[win ? 'winMelee' : 'loseMelee'] += l.lost || 0;
    });
  });
});
Object.keys(G).forEach(k => console.log('R' + k, JSON.stringify(G[k])));
console.log(W);
