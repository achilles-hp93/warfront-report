// Scratch (aiact): a whole battle's ADVANCEs, actions and idle per round, and named units' rounds.
const fs = require('fs');
const [file, ...names] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const units = (r.units || []);
const byUid = {}; units.forEach(u => { byUid[u.uid] = u; });
const rounds = [...new Set((r.moves || []).map(m => m.round).concat((r.activity || []).map(a => a.round)))].sort((a, b) => a - b);
const res = r.result || {};
console.log(`result winner ${res.winner} VP ${(res.vp || []).join('/')} round ${res.round}`);
rounds.forEach(n => {
  const mv = r.moves.filter(m => m.round === n && m.phase === 'MOVEMENT');
  const act = (r.activity || []).filter(a => a.round === n);
  const k = kind => act.filter(a => a.kind === kind).length;
  console.log(`R${n}: adv ${mv.filter(m => m.advanced).length} walk ${mv.filter(m => !m.advanced && !m.charged).length} charge ${mv.filter(m => m.charged).length} | ranged ${k('ranged')} magic ${k('magic')} ability ${k('ability')} melee ${k('melee')} idle ${k('idle')}`);
});
names.forEach(name => {
  const u = units.find(x => x.name === name);
  if (!u) { console.log(name, 'not found'); return; }
  const line = rounds.map(n => {
    const kinds = (r.activity || []).filter(a => a.round === n && a.uid === u.uid && a.kind !== 'objective').map(a => a.kind);
    const pm = r.moves.find(m => m.round === n && m.phase === 'MOVEMENT' && (m.uid === u.uid || m.partner === u.name));
    return `R${n}:${pm ? (pm.advanced ? 'ADV' : pm.charged ? 'CHG' : 'walk') : '-'}/${kinds.join('+') || '-'}`;
  }).join(' ');
  console.log(`${name}: ${line}`);
});
