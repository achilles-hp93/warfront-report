// usage: node unit_rounds.cjs <mNN> <unit name> [player]
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const [m, name, pl] = process.argv.slice(2);
const r = require(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${m}/report.json`);
const us = r.units.filter(u => u.name === name && (pl == null || String(u.player) === pl));
if (!us.length) { console.log('no unit', r.units.map(u => u.name).join(', ')); process.exit(1); }
for (const u of us) {
  console.log(`== ${u.name} uid ${u.uid} player ${u.player} rp ${u.rp} alive ${u.alive} tags ${JSON.stringify(u.tags)}`);
  const armyU = (r.meta.armies || []).flat().find(x => x.uid === u.uid);
  if (armyU) console.log('  army:', JSON.stringify(armyU).slice(0, 400));
  const dep = r.log.find(l => l.msg.includes(u.name + ' deployed at'));
  if (dep) console.log('  ' + dep.msg);
  const rounds = new Set([...r.activity.map(a => a.round), ...r.moves.map(a => a.round)]);
  for (const rd of [...rounds].sort()) {
    console.log(` R${rd}:`);
    r.moves.filter(x => x.round === rd && (x.uid === u.uid || x.partner === u.name)).forEach(x => console.log(`   move ${x.name}${x.partner ? ' + ' + x.partner : ''} ${x.from.col},${x.from.row} -> ${x.to.col},${x.to.row} adv=${x.advanced} chg=${x.charged} ${x.phase}`));
    r.activity.filter(x => x.round === rd && x.uid === u.uid).forEach(x => console.log(`   act ${x.kind} ${x.phase} ${x.why ? JSON.stringify(x.why) : ''} ${x.at ? JSON.stringify(x.at) : ''}`));
    r.combats.filter(x => x.round === rd && ((x.attacker && x.attacker.uid === u.uid) || (x.target && x.target.uid === u.uid))).forEach(x => console.log(`   combat ${x.kind} ${x.phase} ${x.attacker && x.attacker.name}@${x.attacker && x.attacker.at && x.attacker.at.col + ',' + x.attacker.at.row} -> ${x.target && x.target.name}@${x.target && x.target.at && x.target.at.col + ',' + x.target.at.row} losses ${JSON.stringify((x.losses || []).map(l => l.name + '-' + l.lost))}`));
    (r.fallBacks || []).filter(x => x.round === rd && x.uid === u.uid).forEach(x => console.log(`   fallback ${JSON.stringify(x).slice(0, 300)}`));
  }
}
