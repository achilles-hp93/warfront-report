'use strict';
// Which S/cl-shadow2 battles show each item: node scan.cjs <reports dir>
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
fs.readdirSync(dir).filter(d => /m\d\d$/.test(d)).sort().forEach(d => {
  const r = JSON.parse(fs.readFileSync(path.join(dir, d, 'report.json'), 'utf8'));
  const names = (r.meta.armies || []).flat().map(u => u.name);
  const notes = [];
  if (names.some(n => /Lamassu/.test(n))) notes.push('Lamassu Bastion');
  const pairFb = r.log.filter(e => /Fall Back to/.test(e.msg)).map(e => ({ e, name: (e.msg.match(/^\[([^\]]+)\]/) || [])[1] }))
    .filter(x => (r.meta.armies || []).flat().some(u => u.name === x.name && u.leads));
  if (pairFb.length) notes.push('pair Fall Back: ' + pairFb.map(x => 'R' + x.e.round + ' ' + x.name).join(', '));
  const rage = r.log.filter(e => /INSATIABLE RAGE/.test(e.msg) && /moved to/.test(e.msg));
  if (rage.length) notes.push('Insatiable Rage charges: ' + rage.map(e => 'R' + e.round + ' ' + e.msg.slice(0, 60)).join(' | '));
  const ms0 = r.log.filter(e => /needs 6\+/.test(e.msg) && /MELEE|melee/.test(e.msg) && /\[MS 0\]|MS 0/.test(e.msg));
  if (ms0.length) notes.push('MS 0 melee lines ' + ms0.length);
  const hqMelee = (r.combats || []).filter(c => c.kind === 'melee' && c.target && c.target.name === 'HQ');
  if (hqMelee.length) notes.push('melee on an HQ: ' + hqMelee.length);
  if (notes.length) console.log(d.replace('cl-s1-d1-d1-', '') + ': ' + notes.join('; '));
});
