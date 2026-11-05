'use strict';
// How the 24 S/cl-shadow2 records' idle counts change under the advance rule.
// usage: node idle_change.cjs <worktree> <reports dir>
const fs = require('fs');
const path = require('path');
const [wt, dir] = process.argv.slice(2);
const { activityRecord } = require(path.join(wt, 'scripts/battle_report/activity.cjs'));
let oldIdle = 0, newIdle = 0, adv = 0, advOnly = 0;
const byType = {};
const lines = [];
fs.readdirSync(dir).filter(d => /cl-s1-d1-d1-m\d\d/.test(d)).sort().forEach(d => {
  const report = JSON.parse(fs.readFileSync(path.join(dir, d, 'report.json'), 'utf8'));
  const before = (report.activity || []).filter(e => e.kind === 'idle' && !(report.units.find(u => u.uid === e.uid) || {}).isHQ).length;
  const rec = activityRecord(report);
  const rows = rec.rows.filter(r => !r.isHQ);
  const after = rows.reduce((s, r) => s + r.idle, 0);
  const a = rows.reduce((s, r) => s + r.advance, 0);
  const ao = rows.reduce((s, r) => s + r.advanceOnly, 0);
  const hasAdvMoves = (report.moves || []).some(m => m.advanced);
  oldIdle += before; newIdle += after; adv += a; advOnly += ao;
  rows.filter(r => r.advanceOnly > 0).forEach(r => {
    const t = r.name.replace(/ \d+$/, '');
    byType[t] = (byType[t] || 0) + r.advanceOnly;
  });
  lines.push(`${d.replace('cl-s1-d1-d1-', '')}: idle ${before} -> ${after}; ADVANCEs ${a}; advanced, nothing else ${ao}${hasAdvMoves ? '' : ' (no advanced moves recorded)'}`);
});
console.log(lines.join('\n'));
console.log(`TOTAL: idle ${oldIdle} -> ${newIdle} (${oldIdle - newIdle} fewer); ADVANCEs ${adv}; advanced, nothing else ${advOnly}`);
console.log('advanced, nothing else by unit type: ' + Object.entries(byType).sort((x, y) => y[1] - x[1]).map(([k, v]) => k + ' ' + v).join(', '));
