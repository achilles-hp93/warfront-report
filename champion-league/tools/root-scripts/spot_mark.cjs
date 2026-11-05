// Spot & Mark in the record: each use, its target, the intel it raised, and whether the
// marking side then attacked that target while the mark held (the effects record's gains).
const fs = require('fs'), path = require('path');
const roots = process.argv.slice(2);
const t = { uses: 0, attacked: 0, attackedSameRound: 0, noAttack: 0, gainHp: 0, actualHp: 0, attacks: 0, byUser: {}, levels: {}, zeroGainAttacks: 0, deadBefore: 0, targetTypes: {} };
for (const root of roots) for (const name of fs.readdirSync(root)) {
  const dir = path.join(root, name, 'games');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
    const byUid = {}; g.units.forEach(u => byUid[u.uid] = u);
    (g.uses || []).filter(u => u.name === 'Spot & Mark').forEach(u => {
      t.uses++;
      const user = (byUid[u.by] || {}).name || '?'; const un = user.replace(/ \d+$/, '');
      const row = t.byUser[un] || (t.byUser[un] = { uses: 0, shot: 0, gain: 0 });
      row.uses++;
      const ch = (u.changes && u.changes.intel || [])[0];
      if (ch) { const k = ch.from + '->' + ch.to; t.levels[k] = (t.levels[k] || 0) + 1; }
      const tgt = byUid[u.target]; const tn = tgt ? tgt.name.replace(/ \d+$/, '') : '?'; t.targetTypes[tn] = (t.targetTypes[tn] || 0) + 1;
      const atks = (u.gains || []).filter(x => x.kind === 'attack' && x.target === u.target);
      if (atks.length) { t.attacked++; row.shot++; if (atks.some(a => a.round === u.round)) t.attackedSameRound++; }
      else t.noAttack++;
      atks.forEach(a => { t.attacks++; t.gainHp += a.gain || 0; row.gain += a.gain || 0; t.actualHp += a.actual || 0; if (!(a.gain > 0)) t.zeroGainAttacks++; });
    });
  }
}
const r = x => Math.round(x * 10) / 10;
console.log(`uses ${t.uses}; target attacked by the marking side while marked: ${t.attacked} (${t.attackedSameRound} the same round); never attacked: ${t.noAttack}`);
console.log(`attacks on marked targets ${t.attacks}; expected HP the mark added ${r(t.gainHp)} (${r(t.gainHp / Math.max(1, t.uses))} per use); attacks the mark added nothing to ${t.zeroGainAttacks}`);
console.log('intel raised', JSON.stringify(t.levels));
console.log('by user', JSON.stringify(Object.fromEntries(Object.entries(t.byUser).map(([k, v]) => [k, v.uses + ' uses, ' + v.shot + ' shot at, +' + r(v.gain) + ' HP']))));
console.log('targets', JSON.stringify(Object.entries(t.targetTypes).sort((a, b) => b[1] - a[1]).slice(0, 12)));
