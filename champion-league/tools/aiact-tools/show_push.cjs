const fs = require('fs');
const o = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const onlyRound = process.argv[3] ? Number(process.argv[3]) : null;
const P = o.probe || {};
const fmt = r => `R${r.round} P${r.player} ${r.unit} @${r.at} ${r.pushes != null ? (r.pushes ? 'PUSHES' : 'walks') : 'ADV'} ` +
  (r.noCandidate ? '(no push candidate)' : `dest ${r.dest} walk ${r.walk} exp ${r.expected} floor ${r.floor} forgone ${r.forgone} worth ${r.worth} | ` +
  r.members.map(m => `${m.name}: walk ${m.walk} after ${m.after}`).join('; '));
(P.push || []).filter(r => !onlyRound || r.round === onlyRound).forEach(r => console.log('push ' + fmt(r)));
(P.adv || []).filter(r => !onlyRound || r.round === onlyRound).forEach(r => console.log('adv  ' + fmt(r)));
console.log('errors', (P.errors || []).slice(0, 5), o.errors);
console.log('moves:'); o.moves.forEach(m => console.log(`  R${m.round} ${m.name}${m.partner ? ' + ' + m.partner : ''} ${m.from.col},${m.from.row}->${m.to.col},${m.to.row} ${m.advanced ? 'ADV' : ''}${m.charged ? 'CHG' : ''}`));
const names = {}; o.units.forEach(u => names[u.uid] = u.name);
console.log('activity:'); o.activity.filter(a => a.kind !== 'objective').forEach(a => console.log(`  R${a.round} ${a.phase} ${names[a.uid]} ${a.kind} ${a.why ? JSON.stringify(a.why) : ''}`));
console.log('vp', o.vp, 'seconds', o.seconds);
