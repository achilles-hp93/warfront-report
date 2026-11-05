// usage: node read_probe.cjs <NN> [unit name] [round]
const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const [nn, unitName, roundArg] = process.argv.slice(2);
const P = JSON.parse(fs.readFileSync(`${S}/idle-out/probe/m${nn}/probe.json`, 'utf8'));
const wantRound = roundArg ? Number(roundArg) : null;
const okR = r => wantRound == null || r === wantRound;
const okU = n => !unitName || n === unitName;
if (P.errors.length) console.log('probe errors:', [...new Set(P.errors)].slice(0, 20));
const reachStr = r => r.weapons.map(w => w.name + '(' + w.type + ' R' + w.range + ')').filter((x, i, a) => a.indexOf(x) === i).join(',') + ' :: ' + r.enemies.map(e => `${e.name}@${e.at} d${e.d}${e.los ? ' LOS' : ''} [${[...new Set(e.checks.map(c => c.replace(/^[^:]*:/, '')))].join('; ')}]`).join(' | ');
const rounds = [...new Set([].concat(P.choose, P.moveChoice, P.log, P.charge, P.decide).map(x => x.round))].filter(r => r != null).sort((a, b) => a - b);
for (const r of rounds) {
  if (!okR(r)) continue;
  console.log(`\n######## ROUND ${r}`);
  P.decide.filter(x => x.round === r && okU(x.unit)).forEach(x => console.log(`DECIDE ${x.phase} ${x.unit} ${x.type} -> ${x.dest ? x.dest.col + ',' + x.dest.row + ' (' + x.dest.score + ')' : '-'}`));
  P.push.filter(x => x.round === r && okU(x.unit)).forEach(x => console.log(`PUSH ${x.unit} should=${x.should} dest=${x.dest}`));
  P.adv.filter(x => x.round === r && okU(x.unit)).forEach(x => console.log(`ADV ${x.unit} should=${x.should} dest=${x.dest}`));
  P.moveChoice.filter(x => x.round === r && okU(x.unit)).forEach(x => {
    console.log(`MOVECHOICE ${x.unit} at ${x.at} MOVE ${x.move} squares ${x.nSquares} -> ${JSON.stringify(x.out)} global ${JSON.stringify(x.globalBest)} missive ${JSON.stringify(x.missive)} objCommit ${JSON.stringify(x.objCommit)} charge ${x.chargeDeclare || ''} ${x.chargeRaw ? JSON.stringify(x.chargeRaw) : ''}`);
    console.log(`   stay ${JSON.stringify(x.stay)}`);
    if (x.destBd) console.log(`   dest ${JSON.stringify(x.destBd)}`);
    console.log(`   topLocal ${JSON.stringify(x.topLocal)}`);
    if (x.chargeWhy) x.chargeWhy.forEach(w => console.log(`   chargeWhy ${w}`));
    if (x.chargeBlocks) console.log(`   chargeBlocks ${JSON.stringify(x.chargeBlocks)} reachable ${x.chargeAll}`);
  });
  const ch = P.charge.filter(x => x.round === r && okU(x.unit));
  const seen = new Set();
  ch.forEach(x => {
    const k = JSON.stringify(Object.assign({}, x, { seq: 0 }));
    if (seen.has(k)) return; seen.add(k);
    console.log(`CHARGE ${x.phase} ${x.unit} ${x.fn} ${JSON.stringify(Object.assign({}, x, { round: undefined, phase: undefined, unit: undefined, fn: undefined, active: undefined }))}`);
  });
  P.log.filter(x => x.round === r && (!unitName || x.msg.indexOf(unitName) >= 0)).forEach(x => console.log(`LOG ${x.phase} [${x.cat}] ${x.msg}`));
  let last = null;
  P.choose.filter(x => x.round === r).forEach(x => {
    x.units.filter(u => okU(u.name)).forEach(u => {
      const c = x.cands[u.name];
      const line = `CHOOSE#${x.seq} ${x.phase} p${x.player} ${u.name} @${u.col},${u.row} ap=${u.ap} attacked=${u.attacked} usedAct=${u.usedAction} canAct=${u.canStillAct} block=${u.block} adv=${u.advanced} chg=${u.charged} zoc=${u.inZOC} forb=${JSON.stringify(u.forbidden)} | best=${x.best ? x.best.unit + ':' + x.best.type + ' ' + (x.best.ab || '') + '->' + x.best.tgt + ' ' + x.best.score : 'PASS'}`;
      const cl = c ? `      cands(${c.n}): ${c.top.map(t => `${t.type}${t.ab ? '[' + t.ab + ']' : ''}->${t.tgt}=${t.score}${t.legal === undefined ? '' : (t.legal ? '' : '(ILLEGAL)')}`).join(' | ')}` : '      (not collected)';
      const key = line.replace(/CHOOSE#\d+/, '') + cl;
      if (key === last) return; last = key;
      console.log(line); console.log(cl);
      if (c && c.reach) console.log(`      reach: ${reachStr(c.reach)}`);
    });
  });
  P.roundEnd.filter(x => x.round === r).forEach(x => x.units.filter(u => okU(u.name)).forEach(u => console.log(`END ${u.name} @${u.col},${u.row} alive=${u.alive} hp=${u.hp} ap=${u.ap} objs=${x.objectives.join(' ')} reach=${u.reach ? reachStr(u.reach) : ''}`)));
}
