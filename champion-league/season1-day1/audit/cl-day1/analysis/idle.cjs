'use strict';
const fs = require('fs'), path = require('path');
const D = require('./data.json');
const R = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/cl-out/battle_reports';
const info = {}; D.units.forEach(u => { info[u.battle + ':' + u.uid] = u; });
const role = u => u.isHQ ? 'HQ' : u.character ? 'CHARACTER' : ((u.tags || []).some(t => ['VEHICLE', 'MACHINE', 'MONSTER', 'ARTILLERY'].includes(t)) ? 'big ' : '') + (u.rangedW > u.meleeW ? 'shooter' : 'melee');
const G = {}; const byType = {};
let onObjIdle = 0, idleAll = 0;
fs.readdirSync(R).filter(d => d.startsWith('cl-s1-d1-d1-m')).sort().forEach(dir => {
  const id = dir.replace('cl-s1-d1-d1-m', 'M');
  const r = JSON.parse(fs.readFileSync(path.join(R, dir, 'report.json'), 'utf8'));
  (r.activity || []).filter(e => e.kind === 'idle').forEach(e => {
    const u = info[id + ':' + e.uid]; if (!u || u.isHQ) return;
    const ro = role(u);
    const why = !e.why ? 'not asked' : e.why.action ? 'had ' + String(e.why.action).split(/[ :(]/)[0] : 'no legal action';
    G[ro] = G[ro] || {}; G[ro][why] = (G[ro][why] || 0) + 1;
    const snap = r.snaps.find(s => s.label === 'end of round ' + e.round) || r.snaps[r.snaps.length - 1];
    const su = snap.units.find(x => x.uid === e.uid);
    idleAll++;
    if (su && su.col >= 0 && snap.objectives.some(o => Math.max(Math.abs(o.col - su.col), Math.abs(o.row - su.row)) <= 1)) onObjIdle++;
    byType[u.type] = byType[u.type] || { n: 0, why: {} }; byType[u.type].n++; byType[u.type].why[why] = (byType[u.type].why[why] || 0) + 1;
  });
});
console.log(JSON.stringify(G, null, 1));
console.log('idle unit-rounds', idleAll, 'of which standing in an Objective Area at round end', onObjIdle);
