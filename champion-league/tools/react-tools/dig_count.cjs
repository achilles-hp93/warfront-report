// node dig_count.cjs <digest.txt>...: per digest, the charges made, and the Reactions -
// Overwatch (at a charger or a walker), Return Volley, Fire After Enemy Charge, Countercharge -
// with their damage and the units they destroyed.
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const L = fs.readFileSync(f, 'utf8').split('\n');
  const res = (L.find(l => l.startsWith('Result:')) || '').replace('Result: ', '');
  const out = { file: f.split('/').pop(), result: res, charges: 0, ow: 0, owDmg: 0, owKills: 0, volley: 0, volleyDmg: 0, volleyKills: 0,
    faec: 0, faecDmg: 0, cc: 0, ccCanceled: 0 };
  for (const l of L) {
    if (/\(charge\)/.test(l) && /\[MOVEMENT\]|\[ACTION\]/.test(l)) out.charges++;
    const dmg = () => { const m = l.match(/ -(\d+)/g); return m ? m.reduce((t, x) => t + Number(x.slice(2)), 0) : 0; };
    if (/ranged \(Overwatch\)/.test(l)) { out.ow++; out.owDmg += dmg(); if (/DESTROYED/.test(l)) out.owKills++; }
    if (/ranged \(Return Volley\)/.test(l)) { out.volley++; out.volleyDmg += dmg(); if (/DESTROYED/.test(l)) out.volleyKills++; }
    if (/ranged \(Fire After|Fire After Enemy Charge\)/.test(l) && /->/.test(l)) { out.faec++; out.faecDmg += dmg(); }
    if (/Countercharge on .*: /.test(l)) { out.cc++; if (/canceled the CHARGE/.test(l)) out.ccCanceled++; }
  }
  console.log(JSON.stringify(out));
}
