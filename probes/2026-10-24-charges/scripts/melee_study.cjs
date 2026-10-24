// node melee_study.cjs <batch dir>... - melee vs shooting across batches:
//  A. heavy melee units that moved and stayed idle: did they end in an Objective Area (holding)?
//  B. a cheaper friend charged while that heavy unit held an objective idle
//  C. charges answered by a Fall Back: the disorder damage and the objective left
//  D. attacks and damage by kind; charges by units that also shoot, with a target in their shooting reach
const fs = require('fs'), path = require('path');
const dirs = process.argv.slice(2);
const cheb = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
const typeOf = n => String(n || '').replace(/ \d+$/, '');
const T = {};   // unit type stats
const out = { A: { idleMoved: 0, onObjective: 0, offObjective: 0, offNear: 0 }, B: { rounds: 0, examples: [] },
  C: { fellBack: 0, dmg: 0, leftObjective: 0, failedTest: 0 }, D: { attacks: {}, damage: {}, rangedChargers: 0, chargesWithShotInReach: 0, examples: [] } };
const games = [];
for (const dir of dirs) {
  const g = path.join(dir, 'games'); if (!fs.existsSync(g)) continue;
  for (const f of fs.readdirSync(g)) { try { games.push({ label: path.basename(dir) + '/' + f, r: JSON.parse(fs.readFileSync(path.join(g, f))) }); } catch (e) {} }
}
// Unit type profile: melee share, max shot distance, damage per attack by kind.
games.forEach(({ r }) => r.combats.forEach(c => {
  if (c.kind !== 'melee' && c.kind !== 'ranged') return;
  const t = T[typeOf(c.attacker.name)] = T[typeOf(c.attacker.name)] || { melee: 0, ranged: 0, meleeDmg: 0, rangedDmg: 0, maxShot: 0 };
  const dmg = (c.losses || []).filter(l => l.player !== c.attacker.player).reduce((s, l) => s + l.lost, 0);
  t[c.kind]++; t[c.kind + 'Dmg'] += dmg;
  out.D.attacks[c.kind] = (out.D.attacks[c.kind] || 0) + 1; out.D.damage[c.kind] = (out.D.damage[c.kind] || 0) + dmg;
  if (c.kind === 'ranged' && c.phase === 'ACTION' && c.attacker.at && c.target && c.target.at) t.maxShot = Math.max(t.maxShot, cheb(c.attacker.at, c.target.at));
}));
const heavy = u => { const t = T[typeOf(u.name)]; return t && t.melee >= 3 && t.melee >= 4 * t.ranged && (u.rp || 0) >= 35; };
games.forEach(({ label, r }) => {
  const units = {}; r.units.forEach(u => { units[u.uid] = u; });
  const snapAt = n => (r.snaps || []).find(s => s.label === 'end of round ' + n);
  const posAt = (n, uid) => { const s = snapAt(n); const u = s && s.units.find(x => x.uid === uid); return u && u.alive && u.col >= 0 ? u : null; };
  const objs = (r.snaps && r.snaps[0] && r.snaps[0].objectives) || [];
  const inArea = p => objs.some(o => cheb(o, p) <= 1);
  // A + B
  Object.values(r.activity || {}).filter(a => a.kind === 'idle').forEach(a => {
    const u = units[a.uid]; if (!u || !heavy(u)) return;
    const moved = r.moves.some(m => m.round === a.round && m.phase === 'MOVEMENT' && m.uid === a.uid);
    if (!moved) return;
    out.A.idleMoved++;
    const p = posAt(a.round, a.uid); if (!p) return;
    if (inArea(p)) {
      out.A.onObjective++;
      // B: a cheaper friend charged this round an enemy the heavy unit stood within 7 squares of at the round's start
      const start = a.round > 1 ? posAt(a.round - 1, a.uid) : null;
      r.moves.filter(m => m.round === a.round && m.phase === 'MOVEMENT' && m.charged && m.player === u.player && m.uid !== u.uid).forEach(m => {
        const friend = units[m.uid]; if (!friend || (friend.rp || 0) >= (u.rp || 0)) return;
        const log = r.log.find(l => l.round === a.round && l.phase === 'MOVEMENT' && l.msg.startsWith(friend.name + ' Charges '));
        if (!log || !start) return;
        const tname = log.msg.slice((friend.name + ' Charges ').length).split(',')[0].trim();
        const tgt = r.units.find(x => x.name === tname);
        const tpos = tgt && posAt(a.round - 1, tgt.uid);
        if (tpos && cheb(start, tpos) <= 7) { out.B.rounds++; if (out.B.examples.length < 8) out.B.examples.push(`${label} R${a.round}: ${u.name} (${u.rp} RP) held an objective idle; ${friend.name} (${friend.rp} RP) charged ${tname}, ${cheb(start, tpos)} squares from it`); }
      });
    } else {
      out.A.offObjective++;
      if (objs.some(o => cheb(o, p) <= 3)) out.A.offNear++;
    }
  });
  // C
  r.log.forEach((l, i) => {
    const m = /^\[(.+)\] Fall Back to \((\d+),(\d+)\)/.exec(l.msg); if (!m || l.phase !== 'MOVEMENT') return;
    const u = r.units.find(x => x.name === m[1]); if (!u) return;
    // only Fall Backs from a charge this phase
    const charged = r.log.some((x, j) => j < i && x.round === l.round && x.phase === 'MOVEMENT' && / Charges /.test(x.msg) && x.msg.indexOf(m[1]) > 0);
    if (!charged) return;
    out.C.fellBack++;
    const dis = r.log.slice(Math.max(0, i - 8), i).find(x => x.msg.startsWith('[' + m[1] + '] breaks away in disorder'));
    if (dis) { out.C.failedTest++; const d = /(\d+) HP lost/.exec(dis.msg); if (d) out.C.dmg += Number(d[1]); }
    const before = r.moves.filter(x => x.uid === u.uid && x.round === l.round).slice(-1)[0];
    if (before && inArea(before.from) && !inArea(before.to)) out.C.leftObjective++;
  });
  // D: charges by units that also shoot, with an enemy within their longest Action Phase shot at the round's start
  r.moves.filter(m => m.charged).forEach(m => {
    const u = units[m.uid]; const t = u && T[typeOf(u.name)]; if (!t || !(t.ranged >= 2) || !(t.maxShot > 0)) return;
    out.D.rangedChargers++;
    const start = m.from;
    const enemies = r.units.filter(e => e.player !== u.player).map(e => posAt(m.round - 1, e.uid) || (m.round === 1 ? null : null)).filter(Boolean);
    const inReach = enemies.some(e => cheb(start, e) <= t.maxShot);
    if (inReach) {
      out.D.chargesWithShotInReach++;
      const perShot = t.rangedDmg / t.ranged, perFight = t.meleeDmg / Math.max(1, t.melee);
      if (out.D.examples.length < 12) out.D.examples.push(`${label} R${m.round} ${u.name}: charged with a shot in reach (its shots average ${perShot.toFixed(1)} HP, its fights ${perFight.toFixed(1)})`);
    }
  });
});
console.log('games', games.length);
console.log('A heavy melee moved-then-idle rounds', JSON.stringify(out.A));
console.log('B cheaper friend charged while it held', out.B.rounds); out.B.examples.forEach(e => console.log('   ' + e));
console.log('C charges answered by a Fall Back', JSON.stringify(out.C), 'avg disorder HP', (out.C.dmg / Math.max(1, out.C.failedTest)).toFixed(2));
console.log('D attacks', JSON.stringify(out.D.attacks), 'damage', JSON.stringify(out.D.damage));
console.log('D charges by units that also shoot', out.D.rangedChargers, 'with a target in shooting reach', out.D.chargesWithShotInReach); out.D.examples.forEach(e => console.log('   ' + e));
const types = Object.entries(T).filter(([k, t]) => t.ranged >= 3 && t.melee >= 3).map(([k, t]) => `${k}: ${t.ranged} shots ${(t.rangedDmg / t.ranged).toFixed(1)} HP each, ${t.melee} fights ${(t.meleeDmg / t.melee).toFixed(1)} HP each`);
console.log('Types that do both:'); types.forEach(x => console.log('   ' + x));
// E. charges by types whose shot averages clearly more than their fight (x1.2), with a shot in reach
const E = {};
games.forEach(({ label, r }) => {
  const units = {}; r.units.forEach(u => { units[u.uid] = u; });
  r.moves.filter(m => m.charged).forEach(m => {
    const u = units[m.uid]; const t = u && T[typeOf(u.name)]; if (!t || t.ranged < 3 || t.melee < 3) return;
    const perShot = t.rangedDmg / t.ranged, perFight = t.meleeDmg / t.melee;
    const k = typeOf(u.name); const e = E[k] = E[k] || { charges: 0, perShot, perFight };
    e.charges++;
  });
});
console.log('E charges by types that do both (shot avg vs fight avg):');
Object.entries(E).sort((a, b) => (b[1].perShot / Math.max(0.1, b[1].perFight)) - (a[1].perShot / Math.max(0.1, a[1].perFight))).forEach(([k, e]) => console.log(`   ${k}: ${e.charges} charges; shot ${e.perShot.toFixed(1)} vs fight ${e.perFight.toFixed(1)}${e.perShot > 1.2 * e.perFight ? '  <- shots better' : ''}`));
