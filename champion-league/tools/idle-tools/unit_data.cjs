// usage: node unit_data.cjs <faction/unit> ...  (reads the worktree's data)
const fs = require('fs');
const REPO = '/home/user/warfront/.claude/worktrees/agent-acc07f06e9cd4c501';
const W = REPO + '/data/editions/fantasy/weapons';
const findWeapon = (() => {
  const idx = {};
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = d + '/' + e.name;
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.json')) idx[e.name.replace(/\.json$/, '')] = p;
  });
  walk(W);
  return id => idx[id] ? JSON.parse(fs.readFileSync(idx[id], 'utf8')) : null;
})();
for (const u of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(`${REPO}/data/editions/fantasy/units/${u}.json`, 'utf8'));
  console.log(`== ${d.id} ${d.rp} RP ${JSON.stringify(d.tags)} abil: ${(d.abilities || []).map(a => a.ability_id).join(',')} gear: ${(d.gear || []).map(g => g.gear_id).join(',')}`);
  (d.composition || []).forEach(m => {
    console.log(`   ${m.model} x${m.count} MOVE ${(m.stats || {}).MOVE} OC ${(m.stats || {}).OC} MS ${(m.stats || {}).MS} BS ${(m.stats || {}).BS} PER ${(m.stats || {}).PER}`);
    (m.weapons || []).forEach(w => {
      const wd = findWeapon(w.weapon_id);
      const prof = wd ? (wd.profiles || []).map(p => `${p.attack_type} R${(p.stats || {}).RANGE} [${(p.tags || []).join(',')}]`).join(' | ') : '?';
      console.log(`      ${w.weapon_id}: ${prof}`);
    });
  });
}
