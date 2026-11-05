// Per Bogatyr Thunderguards copy per battle: what it did each round, what it dealt and took, how it died.
const fs = require('fs'), path = require('path');
const [root, ...names] = process.argv.slice(2);
const pat = new RegExp(process.env.UNIT || 'Bogatyr');
const tot = { copies: 0, rounds: 0, kinds: {}, dealtRanged: 0, dealtMelee: 0, takenRanged: 0, takenMelee: 0, takenOther: 0, deaths: 0, deathRound: [], killedBy: {}, shotDist: [], meleeIn: 0 };
for (const name of names) {
  const dir = path.join(root, name, 'games');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
    const lastRound = Math.max(...g.activity.map(a => a.round));
    for (const u of g.units.filter(u => pat.test(u.name))) {
      tot.copies++;
      const acts = g.activity.filter(a => a.uid === u.uid);
      const line = [];
      for (let r = 1; r <= lastRound; r++) {
        const ka = acts.filter(a => a.round === r).map(a => a.kind);
        const moved = g.moves.filter(m => m.uid === u.uid && m.round === r);
        const mv = moved.map(m => m.charged ? 'C' : m.advanced ? 'A' : m.fallBack ? 'F' : 'm').join('');
        const out = g.combats.filter(c => c.round === r && c.attacker && c.attacker.uid === u.uid);
        const inn = g.combats.filter(c => c.round === r && c.target && c.target.uid === u.uid);
        let dealt = 0; out.forEach(c => (c.losses || []).forEach(l => { if (l.player !== u.player) { dealt += l.lost; if (c.kind === 'melee') tot.dealtMelee += l.lost; else tot.dealtRanged += l.lost; } }));
        out.forEach(c => { if (c.kind === 'ranged' && c.attacker.at && c.target.at) tot.shotDist.push(Math.max(Math.abs(c.attacker.at.col - c.target.at.col), Math.abs(c.attacker.at.row - c.target.at.row))); });
        let taken = 0; g.combats.filter(c => c.round === r).forEach(c => (c.losses || []).forEach(l => { if (l.uid === u.uid) { taken += l.lost; if (c.kind === 'melee') tot.takenMelee += l.lost; else if (c.kind === 'ranged') tot.takenRanged += l.lost; else tot.takenOther += l.lost; if (l.killed) { tot.deaths++; tot.deathRound.push(r); const k = (c.attacker && c.attacker.name || c.kind).replace(/ \d+$/, '') + '/' + c.kind; tot.killedBy[k] = (tot.killedBy[k] || 0) + 1; } } }));
        if (inn.some(c => c.kind === 'melee')) tot.meleeIn++;
        const alive = !g.combats.some(c => c.round < r && (c.losses || []).some(l => l.uid === u.uid && l.killed));
        if (!alive) break;
        tot.rounds++;
        ka.forEach(k => tot.kinds[k] = (tot.kinds[k] || 0) + 1);
        line.push('R' + r + ':' + (mv || '-') + '/' + (ka.join('+') || '?') + (dealt ? ' d' + dealt : '') + (taken ? ' t' + taken : ''));
      }
      console.log(name.replace('winter-vs-', '').padEnd(16), f.padEnd(12), line.join('  '));
    }
  }
}
const avg = a => a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : '-';
console.log(JSON.stringify({ ...tot, shotDist: undefined, avgShotDist: avg(tot.shotDist), deathRound: avg(tot.deathRound) }));
