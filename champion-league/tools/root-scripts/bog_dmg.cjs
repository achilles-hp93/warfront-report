// Bogatyr damage output per batch: per copy, per round alive, per ranged attack, and the
// rounds it had a shot. node bog_dmg.cjs <root> <batch...>
const fs = require('fs'), path = require('path');
const [root, ...names] = process.argv.slice(2);
const r1 = x => Math.round(x * 10) / 10;
const tot = { copies: 0, rounds: 0, ranged: 0, melee: 0, overwatch: 0, shots: 0, shotsHit: 0, taken: 0 };
for (const name of names) {
  const t = { copies: 0, rounds: 0, ranged: 0, melee: 0, overwatch: 0, shots: 0, taken: 0, firedRounds: 0 };
  const dir = path.join(root, name, 'games');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
    for (const u of g.units.filter(u => /bogatyr/.test(u.templateId || ''))) {
      t.copies++;
      const acts = g.activity.filter(a => a.uid === u.uid);
      t.rounds += new Set(acts.map(a => a.round)).size;
      t.firedRounds += new Set(acts.filter(a => a.kind === 'ranged' || a.kind === 'overwatch').map(a => a.round)).size;
      g.combats.filter(c => c.attacker && c.attacker.uid === u.uid).forEach(c => {
        const dealt = (c.losses || []).filter(l => l.player !== u.player).reduce((s, l) => s + l.lost, 0);
        if (c.kind === 'melee') t.melee += dealt;
        else if (c.kind === 'ranged') { t.ranged += dealt; t.shots++; if (/overwatch/i.test(c.label || '') || c.phase !== 'ACTION') t.overwatch += dealt; }
      });
      g.combats.forEach(c => (c.losses || []).forEach(l => { if (l.uid === u.uid) t.taken += l.lost; }));
    }
  }
  const dmg = t.ranged + t.melee;
  console.log(name.padEnd(22), `copies ${t.copies} | dmg/copy ${r1(dmg / t.copies)} (ranged ${r1(t.ranged / t.copies)}, melee ${r1(t.melee / t.copies)}) | per round alive ${r1(dmg / t.rounds)} | rounds alive/copy ${r1(t.rounds / t.copies)} | shots ${t.shots}, ${r1(t.ranged / Math.max(1, t.shots))} HP each | fired in ${t.firedRounds}/${t.rounds} rounds | taken/copy ${r1(t.taken / t.copies)}`);
}
