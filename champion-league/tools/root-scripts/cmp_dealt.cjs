const fs = require('fs');
const { enrichCombats } = require('/home/user/warfront/.claude/worktrees/cl-d1-report/scripts/battle_report/page/enrich.cjs');
const dir = process.argv[2];
let tot = { same: 0, diff: 0 };
for (const d of fs.readdirSync(dir).sort()) {
  const r = JSON.parse(fs.readFileSync(`${dir}/${d}/report.json`));
  enrichCombats(r);
  const dealt = {}, ff = {}, kills = {};
  r.combats.forEach(c => { if (!c.attacker) return; (c.losses||[]).forEach(l => {
    if (l.player === c.attacker.player) ff[c.attacker.uid] = (ff[c.attacker.uid]||0) + (l.lost||0);
    else { dealt[c.attacker.uid] = (dealt[c.attacker.uid]||0) + (l.lost||0); if (l.killed) kills[c.attacker.uid]=(kills[c.attacker.uid]||0)+1; }
  }); });
  const unatt = r.combats.filter(c => !c.attacker).reduce((t,c)=>t+(c.losses||[]).reduce((s,l)=>s+(l.lost||0),0),0);
  const lines = [];
  r.units.forEach(u => { const s = (u.stats||{}).totalDmgDealt||0; const k=((u.stats||{}).kills||[]).length; const m = dealt[u.uid]||0;
    if (s !== m || (ff[u.uid]||0) || k !== (kills[u.uid]||0)) { tot.diff++; lines.push(`${u.name}: stats ${s}/${k}k record ${m}/${kills[u.uid]||0}k ff ${ff[u.uid]||0}`); } else tot.same++; });
  console.log(d, 'unattributed', unatt, '|', lines.join('; '));
}
console.log(tot);
