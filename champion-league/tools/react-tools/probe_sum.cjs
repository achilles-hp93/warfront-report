// Summarize the react probe and AI time of replays: node probe_sum.cjs <report.json>... [--detail]
const fs = require('fs');
const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
const detail = process.argv.includes('--detail');
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const P = r.reactProbe || { charges: [], overwatch: [], faec: [], cc: [] };
  const L = r.log.map(l => l.msg || '');
  const cnt = re => L.filter(m => re.test(m)).length;
  const A = r.aiPerf || { decisions: [], picks: [] };
  const sum = xs => Math.round(xs.reduce((t, d) => t + d.ms, 0));
  const part = name => Math.round(A.decisions.reduce((t, d) => t + ((d.parts || {})[name] ? d.parts[name][0] : 0), 0));
  const calls = name => A.decisions.reduce((t, d) => t + ((d.parts || {})[name] ? d.parts[name][1] : 0), 0);
  const ch = P.charges;
  const intoOw = ch.filter(c => (c.watchers || []).length);
  const intoCc = ch.filter(c => (c.ccGated || []).length);
  const intoFa = ch.filter(c => (c.responders || []).length);
  const owCh = P.overwatch.filter(o => o.charging);
  const out = {
    file: f.split('/').slice(-2, -1)[0], result: r.result && [r.result.winner, r.result.round, (r.result.vp || []).join('/')],
    declared: ch.length, granted: ch.filter(c => c.granted).length, landed: cnt(/ Charges /), failed: cnt(/CHARGE FAILED/),
    intoOverwatchReady: intoOw.length, intoCounterchargeable: intoCc.length, intoFaec: intoFa.length,
    overwatchAtChargers: owCh.length, overwatchShotsAtChargers: owCh.reduce((t, o) => t + o.shots, 0), overwatchDmgToChargers: owCh.reduce((t, o) => t + o.dmg, 0),
    chargersDestroyedByOverwatch: owCh.filter(o => o.destroyed).length,
    overwatchAll: P.overwatch.length, faecShots: P.faec.reduce((t, o) => t + o.shots, 0), faecDmg: P.faec.reduce((t, o) => t + o.dmg, 0),
    counterchargesMade: P.cc.length, counterchargesCanceled: cnt(/canceled by the Countercharge/),
    volleysOffered: (P.volleys || []).length, volleyDmg: (P.volleys || []).reduce((t, v) => t + Math.max(0, (v.hpBefore || 0) - (v.hpAfter || 0)), 0),
    volleyKills: (P.volleys || []).filter(v => v.destroyed).length,
    aiMs: sum(A.decisions) + sum(A.picks), decisionsMs: sum(A.decisions), picksMs: sum(A.picks), movementMs: part('aiDecideMovement'), fallBackMs: part('_aiEvalFallBack'),
    destCalls: calls('aiScoreDestination'), chargeSquareCalls: calls('_aiScoreChargeSquare'),
    movePhaseDecMs: Math.round(A.decisions.filter(d => d.phase === 'MOVEMENT').reduce((t, d) => t + d.ms, 0)),
    chargeDecMs: Math.round(A.decisions.filter(d => d.type === 'charge').reduce((t, d) => t + d.ms, 0)),
  };
  if (P.timing) Object.keys(P.timing).forEach(k => { out['t:' + k] = [Math.round(P.timing[k].ms), P.timing[k].calls]; });
  console.log(JSON.stringify(out));
  if (detail) {
    ch.forEach(c => console.log('  charge', JSON.stringify(c)));
    P.overwatch.forEach(o => console.log('  ow', JSON.stringify(o)));
    P.faec.forEach(o => console.log('  faec', JSON.stringify(o)));
    P.cc.forEach(o => console.log('  cc', JSON.stringify(o)));
    (P.volleys || []).forEach(o => console.log('  volley', JSON.stringify(o)));
  }
}
