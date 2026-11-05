// node compare31.cjs <reports root> <batch...>: per batch, the focus side's record and the
// units the 2026-10-26 changes touch.
const fs = require('fs'), path = require('path');
const [root, ...names] = process.argv.slice(2);
const r1 = x => Math.round(x * 10) / 10;
for (const name of names) {
  const dir = path.join(root, name, 'games');
  if (!fs.existsSync(dir)) { console.log(name, 'missing'); continue; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const focusFaction = process.env.FOCUS || (/^s2-rurik/.test(name) ? 'principality_of_novgorod' : 'golden_khaganate');
  const t = { games: 0, wins: 0, vpFor: 0, vpAg: 0, bog: { copies: 0, vp: 0, alive: 0, meleeTaken: 0, rangedDealt: 0, idle: 0, rounds: 0, fireSupportish: 0 },
    levy: { copies: 0, vp: 0, meleeRounds: 0, rounds: 0 }, intoMelee: 0, intoMeleeFriendHit: 0,
    fb: { tests: 0, failed: 0, need: {} }, ur: 0 };
  for (const f of files) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
    t.games++;
    const side = g.meta.factions.indexOf(focusFaction);
    if (g.result && g.result.winner === side) t.wins++;
    const vp = g.result && g.result.vp || [0, 0];
    t.vpFor += vp[side] || 0; t.vpAg += vp[1 - side] || 0;
    // VP shares per unit from the attribution.
    const share = {};
    (g.attribution || []).forEach(a => Object.entries(a.shares || {}).forEach(([uid, v]) => { share[uid] = (share[uid] || 0) + v; }));
    const byUid = {}; g.units.forEach(u => byUid[u.uid] = u);
    g.units.filter(u => /bogatyr_thunderguards/.test(u.templateId || '')).forEach(u => {
      t.bog.copies++; t.bog.vp += share[u.uid] || 0; if (u.alive) t.bog.alive++;
      g.combats.forEach(c => (c.losses || []).forEach(l => { if (l.uid === u.uid && c.kind === 'melee') t.bog.meleeTaken += l.lost; }));
      g.combats.filter(c => c.kind === 'ranged' && c.attacker && c.attacker.uid === u.uid).forEach(c => (c.losses || []).forEach(l => { if (l.player !== u.player) t.bog.rangedDealt += l.lost; }));
      g.activity.filter(a => a.uid === u.uid).forEach(a => { t.bog.rounds++; if (a.kind === 'idle') t.bog.idle++; });
    });
    g.units.filter(u => /veche_levy/.test(u.templateId || '')).forEach(u => {
      t.levy.copies++; t.levy.vp += share[u.uid] || 0;
      g.activity.filter(a => a.uid === u.uid).forEach(a => { t.levy.rounds++; if (a.kind === 'melee') t.levy.meleeRounds++; });
    });
    // Shots into a melee: replay positions (deployment, then moves) beside the attacks in
    // order; a ranged attack at a target with a friend of the attacker beside it.
    const pos = {}; const dead = new Set();
    g.snaps[0].units.forEach(u => { pos[u.uid] = { col: u.col, row: u.row, player: u.player, templateId: u.templateId }; });
    const events = g.moves.map(m => ({ seq: m.seq, m })).concat(g.combats.map(c => ({ seq: c.seq, c }))).sort((a, b) => a.seq - b.seq);
    events.forEach(e => {
      if (e.m) { if (pos[e.m.uid]) { pos[e.m.uid].col = e.m.to.col; pos[e.m.uid].row = e.m.to.row; } return; }
      const c = e.c;
      if (c.kind === 'ranged' && c.attacker && c.target && c.target.at) {
        if (c.target.player === c.attacker.player) t.intoMeleeFriendHit++;
        else {
          const beside = Object.entries(pos).filter(([uid, p]) => !dead.has(+uid) && p.player === c.attacker.player && +uid !== c.attacker.uid
            && Math.max(Math.abs(p.col - c.target.at.col), Math.abs(p.row - c.target.at.row)) <= 1 && p.templateId !== 'hq');
          if (beside.length) { t.intoMelee++; if (/bogatyr/.test((byUid[c.attacker.uid] || {}).templateId || '')) t.bogIntoMelee = (t.bogIntoMelee || 0) + 1; }
        }
      }
      (c.losses || []).forEach(l => { if (l.killed) dead.add(l.uid); });
    });
    const mounted = new Set(g.units.filter(u => /golden_khaganate/.test(u.templateId || '') && (u.tags || []).includes('MOUNTED')).map(u => u.uid));
    g.fallBacks.filter(d => mounted.has(d.uid) && d.fellBack && d.test && !d.test.waiver).forEach(d => {
      t.fb.tests++; if (!d.test.passed) t.fb.failed++; t.fb.need[d.test.need] = (t.fb.need[d.test.need] || 0) + 1; });
    (g.uses || []).forEach(u => { if (/Universal Ruler/.test(u.name || u.ability || JSON.stringify(u).slice(0, 200))) t.ur++; });
  }
  const b = t.bog, lv = t.levy;
  console.log(name.padEnd(22), 'W-L', t.wins + '-' + (t.games - t.wins), 'VP', r1(t.vpFor / t.games), 'v', r1(t.vpAg / t.games),
    b.copies ? `| Bogatyr VP/copy ${r1(b.vp / b.copies)} alive ${b.alive}/${b.copies} meleeHP ${b.meleeTaken} rangedDealt ${b.rangedDealt} idle ${b.idle}/${b.rounds}` : '',
    lv.copies ? `| Levy VP/copy ${r1(lv.vp / lv.copies)} melee ${lv.meleeRounds}/${lv.rounds}` : '',
    `| intoMelee ${t.intoMelee} (Bogatyr ${t.bogIntoMelee || 0}) strays ${t.intoMeleeFriendHit}`,
    t.fb.tests ? `| riders FB tests ${t.fb.tests} failed ${t.fb.failed} need ${JSON.stringify(t.fb.need)}` : '', t.ur ? `| UR uses ${t.ur}` : '');
}
