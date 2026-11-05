'use strict';
// After a pair's Fall Back, did its CHARACTER act that round? After a granted Charge, did the
// unit shoot? node scan2.cjs <reports dir>
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
fs.readdirSync(dir).filter(d => /m\d\d$/.test(d)).sort().forEach(d => {
  const r = JSON.parse(fs.readFileSync(path.join(dir, d, 'report.json'), 'utf8'));
  const army = (r.meta.armies || []).flat();
  const byName = (n, p) => army.find(u => u.name === n && (p == null || u.player === p));
  r.log.forEach((e, i) => {
    const m = e.msg.match(/^\[([^\]]+)\] Fall Back to/);
    if (m) {
      const squad = byName(m[1]);
      if (!squad || !squad.leads) return;
      const ch = byName(squad.leads, squad.player);
      const acts = (r.activity || []).filter(a => a.round === e.round && a.uid === ch.uid && /ranged|melee|ability|magic/.test(a.kind));
      const fired = r.log.slice(i).filter(x => x.round === e.round && x.msg.indexOf(squad.leads + ' opens fire') === 0 || (x.round === e.round && new RegExp('^\\[?' + squad.leads.replace(/[()]/g, '.') + '\\]? (uses|casts)').test(x.msg)));
      console.log(`${d.slice(-3)} R${e.round}: ${m[1]} + ${squad.leads} fell back; the CHARACTER then: ${acts.map(a => a.kind).join(', ') || 'nothing'}${fired.length ? ' [' + fired.map(x => x.msg.slice(0, 70)).join(' | ') + ']' : ''}`);
    }
    const g = e.msg.match(/^\[([^\]]+)\] INSATIABLE RAGE: moved to/);
    if (g) {
      const later = r.log.slice(i + 1).filter(x => x.round === e.round && x.msg.indexOf(g[1] + ' opens fire') === 0);
      console.log(`${d.slice(-3)} R${e.round} [${e.phase}]: ${g[1]} granted Charge; fired after: ${later.length}`);
    }
  });
});
