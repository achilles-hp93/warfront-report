// Turn in the Saddle in the record: Khaganate MOUNTED Fall Backs, the shots after them,
// shots at the unit fallen back from, and the reworked abilities' uses.
const fs = require('fs'), path = require('path');
const [root, ...names] = process.argv.slice(2);
for (const name of names) {
  const dir = path.join(root, name, 'games');
  const t = { games: 0, wins: 0, engagedDecisions: 0, fellBack: 0, stayed: 0, shotAfter: 0, turnedShots: 0, turnedDmg: 0, otherShotDmg: 0, uses: {} };
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
    t.games++;
    const kh = g.units.filter(u => /golden_khaganate/.test(u.templateId || '') || /^(Stormrider|Khesig|Nerge|Stormlord|Genghis|Black Shaman|Tamga)/.test(u.name));
    const khPlayer = kh.length ? kh[0].player : null;
    if (g.result && g.result.winner === khPlayer) t.wins++;
    const mounted = new Set(kh.filter(u => (u.tags || []).includes('MOUNTED')).map(u => u.uid));
    g.fallBacks.filter(d => mounted.has(d.uid)).forEach(d => {
      t.engagedDecisions++;
      if (!d.fellBack) { t.stayed++; return; }
      t.fellBack++;
      const left = new Set(((d.board && d.board.engagers) || []).map(e => e.uid));
      const shots = g.combats.filter(c => c.round === d.round && c.kind === 'ranged' && c.attacker && c.attacker.uid === d.uid);
      if (shots.length) t.shotAfter++;
      shots.forEach(c => {
        const dmg = (c.losses || []).filter(l => l.player !== khPlayer).reduce((s, l) => s + l.lost, 0);
        if (left.has(c.target.uid)) { t.turnedShots++; t.turnedDmg += dmg; } else t.otherShotDmg += dmg;
      });
    });
    (g.uses || []).filter(u => u.player === khPlayer).forEach(u => { const k = u.name || u.label || u.id; t.uses[k] = (t.uses[k] || 0) + 1; });
  }
  console.log('==', name, JSON.stringify(t));
}
