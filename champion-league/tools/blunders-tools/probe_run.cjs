#!/usr/bin/env node
'use strict';
// Scratch runner (analysis only), after the audit's audit_probe.cjs: replay one Day 1
// battle with record.cjs's own recordBattle and the probe installed beside the recorder.
//   WARFRONT_OUTPUT_DIR=<dir> node probe_run.cjs <NN> '<cfg json>' <outdir> [<compare-shadow3: 1|0>]
const fs = require('fs');
const path = require('path');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const WT = '/home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b';
const { recordBattle, startRecorder } = require(WT + '/scripts/battle_report/record.cjs');
const [nn, cfgJson, outDir, compare] = process.argv.slice(2);
const cfg = JSON.parse(cfgJson);
const state = JSON.parse(fs.readFileSync(S + '/cl-shadow3/tournaments/cl-s1/state.json', 'utf8'));
const match = state.days[0].matches.find(m => m.id === 'D1-M' + nn);
const PROBE = fs.readFileSync(path.join(__dirname, 'page_probe.js'), 'utf8');
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const recorder = await startRecorder({});
  const harness = recorder.harness;
  const newPage = harness.newPage.bind(harness);
  harness.newPage = async (...args) => {
    const page = await newPage(...args);
    const evalOrig = page.eval.bind(page);
    if (page.waitFor) { const wf = page.waitFor.bind(page); page.waitFor = (expr, ms) => wf(expr, (ms || 30000) * 5); }
    page.eval = async (expr, timeout) => {
      if (typeof expr === 'string' && expr.indexOf('log: (G.combatLog') >= 0 && expr.indexOf('const R = window.__battleRecord;\n  return {') >= 0) {
        const probe = await evalOrig('JSON.stringify(window.__auditProbe || null)', 120000);
        fs.writeFileSync(path.join(outDir, 'probe.json'), probe);
      }
      const out = await evalOrig(expr, timeout);
      if (typeof expr === 'string' && expr.indexOf('installBattleRecorder(') >= 0) {
        const msg = await evalOrig(`${PROBE}\ninstallAuditProbe(${JSON.stringify(cfg)})`);
        console.log('probe:', msg);
      }
      return out;
    };
    return page;
  };
  try {
    const report = await recordBattle(harness, {
      a: { faction: match.a.faction, formation: match.a.formation }, b: { faction: match.b.faction, formation: match.b.formation },
      seed: match.seed, map: 'CROSSROADS', images: false, noDoctrine: true, log: l => console.log(`[m${nn}] ${l}`),
    });
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report));
    // Where digest.cjs reads it: <output dir>/battle_reports/<NAME>/report.json.
    if (process.env.REPORT_NAME) {
      const { reportDir } = require(WT + '/scripts/battle_report/record.cjs');
      fs.writeFileSync(path.join(reportDir(process.env.REPORT_NAME + '-m' + nn), 'report.json'), JSON.stringify(report));
    }
    if (compare === '1') {
      const orig = JSON.parse(fs.readFileSync(`${S}/cl-shadow3/battle_reports/cl-s1-d1-d1-m${nn}/report.json`, 'utf8'));
      const key = m => `${m.round}|${m.phase}|${m.name}|${m.from.col},${m.from.row}->${m.to.col},${m.to.row}|${m.charged}`;
      const ck = c => `${c.round}|${c.phase}|${c.kind}|${c.attacker && c.attacker.name}|${c.target && c.target.name}|${JSON.stringify((c.losses || []).map(l => l.lost))}`;
      const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
      console.log(`m${nn} replay matches: moves ${same(orig.moves.map(key), report.moves.map(key))} (${orig.moves.length}/${report.moves.length}), combats ${same(orig.combats.map(ck), report.combats.map(ck))} (${orig.combats.length}/${report.combats.length}), result ${JSON.stringify(orig.result) === JSON.stringify(report.result)} ${JSON.stringify(report.result)}`);
    } else {
      console.log(`m${nn} result ${JSON.stringify(report.result)}`);
    }
  } finally {
    await recorder.stop();
  }
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
