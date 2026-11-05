'use strict';
// Scratch: across the check run's 24 records, the idle entries the new recorder rule drops
// because the unit recorded an action that same round (any entry but idle and overwatch),
// and the set_ap casts (APt zeroed) each record's log shows.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
let totalIdle = 0, totalDrop = 0, noWhy = 0;
const byKind = {};
for (let i = 1; i <= 24; i++) {
  const nn = String(i).padStart(2, '0');
  const r = JSON.parse(fs.readFileSync(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${nn}/report.json`, 'utf8'));
  const names = {}; r.units.forEach(u => { names[u.uid] = u.name; });
  const acted = {};
  r.activity.forEach(e => { if (e.kind !== 'idle' && e.kind !== 'overwatch') (acted[e.round + ':' + e.uid] = acted[e.round + ':' + e.uid] || []).push(e.kind); });
  const idle = r.activity.filter(e => e.kind === 'idle');
  const drop = idle.filter(e => acted[e.round + ':' + e.uid]);
  totalIdle += idle.length; totalDrop += drop.length;
  noWhy += idle.filter(e => !e.why && !acted[e.round + ':' + e.uid]).length;
  drop.forEach(e => acted[e.round + ':' + e.uid].forEach(k => { byKind[k] = (byKind[k] || 0) + 1; }));
  const setAp = r.log.filter(l => /Daemonium Meridianum|Flesh Temptation|Imperative/i.test(l.msg || ''));
  console.log(`m${nn}: idle ${idle.length}, dropped for an action ${drop.length}` + (drop.length ? ' - ' + drop.map(e => `R${e.round} ${names[e.uid]} (${acted[e.round + ':' + e.uid].join('+')})`).join('; ') : ''));
  setAp.forEach(l => console.log(`    log R${l.round} ${l.phase}: ${l.msg}`));
}
console.log(`TOTAL idle ${totalIdle}, dropped for an action ${totalDrop}`, byKind, 'idle kept without why', noWhy);
