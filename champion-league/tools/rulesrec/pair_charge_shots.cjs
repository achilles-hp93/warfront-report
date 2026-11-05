'use strict';
// Scratch: ranged attacks a joined CHARACTER made in a Battle Round its pair charged
// (a charge move, or a failed CHARGE in the log), over battle records.
//   node pair_charge_shots.cjs <report.json>...   (default: the check run's 24)
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
let files = process.argv.slice(2);
if (!files.length) for (let i = 1; i <= 24; i++) files.push(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${String(i).padStart(2, '0')}/report.json`);
let total = 0, charges = 0;
files.forEach(file => {
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  // Each charge: the round, the squad's name and its partner's.
  const charged = [];
  (r.moves || []).forEach(m => { if (m.charged && m.partner) charged.push({ round: m.round, seq: m.seq, squad: m.name, partner: m.partner, player: m.player }); });
  (r.log || []).forEach(l => {
    const f = /^(.+?) CHARGE FAILED/.exec(l.msg || '');
    if (!f) return;
    const squad = (r.units || []).find(u => u.name === f[1]);
    // The pair at the time: the snapshot before the round's end.
    const snap = (r.snaps || []).filter(s => s.round <= l.round).pop();
    const su = snap && snap.units.find(u => u.name === f[1]);
    const partnerUid = su && (su.joinedCharacter != null ? su.joinedCharacter : su.joinedSquad);
    const partner = partnerUid != null && snap.units.find(u => u.uid === partnerUid);
    if (squad && partner) charged.push({ round: l.round, squad: f[1], partner: partner.name, player: squad.player, failed: true });
  });
  charges += charged.length;
  charged.forEach(c => {
    const shots = (r.combats || []).filter(x => x.round === c.round && x.kind === 'ranged' && x.attacker && x.attacker.name === c.partner && x.attacker.player === c.player && (c.seq == null || x.seq > c.seq));
    if (!shots.length) return;
    total += shots.length;
    console.log(`${file.split('/').slice(-2, -1)[0]} R${c.round}: ${c.squad} ${c.failed ? 'failed a CHARGE' : 'charged'}; its CHARACTER ${c.partner} fired ${shots.length}x: ${shots.map(x => x.phase + (x.overwatch || /overwatch/i.test(x.label || '') ? ' (Overwatch)' : '') + ' at ' + (x.target && x.target.name)).join(', ')}`);
  });
});
console.log(`pair charges ${charges}; CHARACTER ranged attacks in the round its pair charged: ${total}`);
