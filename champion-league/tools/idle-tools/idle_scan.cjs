// Scan all 24 check-run records: idle rounds that also carry an action, or an ADVANCE.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
let tot = { idle: 0, withAction: 0, advanced: 0, charged: 0, chargedNoMelee: 0 };
const per = [];
for (let i = 1; i <= 24; i++) {
  const nn = String(i).padStart(2, '0');
  const r = JSON.parse(fs.readFileSync(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${nn}/report.json`, 'utf8'));
  const info = {}; r.units.forEach(u => { info[u.uid] = u; });
  const uidOf = (name, p) => (r.units.find(u => u.name === name && u.player === p) || {}).uid;
  const moveOf = {};
  r.moves.forEach(m => {
    if (m.phase !== 'MOVEMENT') return;
    [m.uid, m.partner ? uidOf(m.partner, m.player) : null].filter(x => x != null).forEach(uid => {
      const k = m.round + ':' + uid; moveOf[k] = moveOf[k] || []; moveOf[k].push(m);
    });
  });
  const acts = {};
  r.activity.forEach(a => { if (a.kind !== 'idle' && a.kind !== 'objective' && a.kind !== 'overwatch') { const k = a.round + ':' + a.uid; (acts[k] = acts[k] || []).push(a.kind); } });
  r.activity.filter(a => a.kind === 'idle').forEach(a => {
    const u = info[a.uid] || {}; if (u.isHQ) return;
    tot.idle++;
    const k = a.round + ':' + a.uid;
    const ms = moveOf[k] || [];
    const row = { m: nn, round: a.round, name: u.name, rp: u.rp, acts: acts[k] || [], adv: ms.some(m => m.advanced), chg: ms.some(m => m.charged), why: a.why };
    if (row.acts.length) tot.withAction++;
    if (row.adv) tot.advanced++;
    if (row.chg) tot.charged++;
    per.push(row);
  });
}
console.log(JSON.stringify(tot));
const want = process.argv[2];
per.filter(r => want === 'acts' ? r.acts.length : want === 'big' ? r.rp >= 40 : true).forEach(r => console.log(`M${r.m} R${r.round} ${r.name} (${r.rp}) acts=${r.acts.join(',')} adv=${r.adv} chg=${r.chg} why=${JSON.stringify(r.why)}`));
// By round 1 vs later
const r1 = per.filter(r => r.round === 1);
console.log(`round-1 idle ${r1.length}, of which advanced ${r1.filter(r => r.adv).length}; later rounds idle ${per.length - r1.length}, advanced ${per.filter(r => r.round > 1 && r.adv).length}, charged ${per.filter(r => r.round > 1 && r.chg).length}, with an action ${per.filter(r => r.acts.length).length}`);
