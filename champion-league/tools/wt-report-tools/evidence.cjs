// evidence.cjs <worktree> <record name> - the lines of a replayed record each Day 1 fix
// is about, read with the worktree's tools from WARFRONT_OUTPUT_DIR.
const path = require('path');
const fs = require('fs');
const WT = process.argv[2];
const name = process.argv[3];
const { digest } = require(path.join(WT, 'scripts/battle_report/digest.cjs'));
const { REPORTS_DIR } = require(path.join(WT, 'scripts/battle_report/paths.cjs'));
const file = path.join(REPORTS_DIR, name, 'report.json');
const raw = () => JSON.parse(fs.readFileSync(file, 'utf8'));
const r = raw();
const text = digest(raw());
const lines = text.split('\n');
const out = [];
const pick = (label, re, max) => {
  const hit = lines.filter(l => re.test(l));
  out.push(`-- ${label} (${hit.length})`);
  hit.slice(0, max || 6).forEach(l => out.push(l.length > 260 ? l.slice(0, 260) + ' ...' : l));
};
out.push(`${name}: ${lines[1]}; errors ${r.errors.length}${r.errors.length ? ' ' + JSON.stringify(r.errors.slice(0, 3)) : ''}`);
out.push(`credits to no unit (by and src null): ${(r.credits || []).filter(c => c.by == null && c.src == null).length}; with sides: ${(r.credits || []).filter(c => c.player !== undefined).length}/${(r.credits || []).length}`);
out.push(`meta.armies RP: ${r.meta.armies.map(a => a.reduce((s, u) => s + u.rp, 0)).join(' / ')}; deployment snapshot units: ${r.snaps[0].units.length}, meta.armies units: ${r.meta.armies.flat().length}`);
pick('army lines', /^Army /);
pick('field damage points', /BURNING FIELD|\(Burning, /, 8);
pick('costs paid on combat points', /cost paid:/);
pick('friendly fire combat points', /FRIENDLY FIRE/);
pick('Three Standards / Sacred Rabies / Black Vortex uses', /\] [AB]:.+ (Three Standards|Blessing of Sacred Rabies|Black Vortex of Dis)( on .+)?: /, 8);
pick('idle lists', /^Idle /, 2);
const act = r.activity || [];
out.push(`activity: ${act.filter(e => e.kind === 'objective').length} objective-held entries, ${act.filter(e => e.kind === 'idle').length} idle; entries with a side ${act.filter(e => e.player !== undefined).length}/${act.length}`);
const at = lines.indexOf('Damage leaders:');
out.push('-- damage leaders (top 6)');
lines.slice(at + 1, at + 7).forEach(l => out.push(l));
const ff = lines.indexOf('Friendly fire (HP and units a unit took off its own side):');
if (ff >= 0) { out.push('-- friendly fire'); for (let i = ff + 1; i < lines.length && /^  /.test(lines[i]); i++) out.push(lines[i]); }
const cp = lines.findIndex(l => /^Costs paid/.test(l));
if (cp >= 0) { out.push('-- costs paid'); for (let i = cp + 1; i < lines.length && /^  /.test(lines[i]); i++) out.push(lines[i]); }
console.log(out.join('\n'));
