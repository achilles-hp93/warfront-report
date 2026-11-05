#!/usr/bin/env node
'use strict';
// Scratch runner (analysis only): replay one Day 1 check-run battle with record.cjs's own
// recordBattle and the idle probe installed beside the recorder.
//   WARFRONT_OUTPUT_DIR=<idle-out> node probe_record.cjs <NN> "<name>|<player>" ...
const fs = require('fs');
const path = require('path');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const REPO = '/home/user/warfront/.claude/worktrees/agent-acc07f06e9cd4c501';
const { recordBattle, startRecorder } = require('/home/user/warfront/.claude/worktrees/agent-a002da0b183ae09e2/scripts/battle_report/record.cjs');

const [nn, ...targetArgs] = process.argv.slice(2);
const targets = targetArgs.map(t => { const [name, p] = t.split('|'); return { name, player: Number(p) }; });
const state = JSON.parse(fs.readFileSync(S + '/cl-shadow/tournaments/cl-s1/state.json', 'utf8'));
const match = state.days[0].matches.find(m => m.id === 'D1-M' + nn);
const PROBE = fs.readFileSync('/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/idle-tools/page_idle_probe.js', 'utf8');
const outDir = path.join(process.env.WARFRONT_OUTPUT_DIR, 'probe', (process.env.PROBE_TAG || '') + 'm' + nn);
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const recorder = await startRecorder({});
  const harness = recorder.harness;
  const newPage = harness.newPage.bind(harness);
  harness.newPage = async (...args) => {
    const page = await newPage(...args);
    const evalOrig = page.eval.bind(page);
    page.eval = async (expr, timeout) => {
      if (typeof expr === 'string' && expr.indexOf('log: (G.combatLog') >= 0 && expr.indexOf('const R = window.__battleRecord;\n  return {') >= 0) {
        const probe = await evalOrig('JSON.stringify(window.__idleProbe || null)', 120000);
        fs.writeFileSync(path.join(outDir, 'probe.json'), probe);
      }
      const out = await evalOrig(expr, timeout);
      if (typeof expr === 'string' && expr.indexOf('installBattleRecorder(') >= 0) {
        const msg = await evalOrig(`${PROBE}\ninstallIdleProbe(${JSON.stringify(targets)})`);
        console.log('probe:', msg);
      }
      return out;
    };
    return page;
  };
  try {
    const report = await recordBattle(harness, {
      a: { faction: match.a.faction, formation: match.a.formation }, b: { faction: match.b.faction, formation: match.b.formation },
      seed: match.seed, map: state.config.map, images: false, noDoctrine: true, log: l => console.log(`[m${nn}] ${l}`),
    });
    delete report.snaps;
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report));
    // Does the replay match the check run?
    const orig = JSON.parse(fs.readFileSync(`${S}/cl-shadow/battle_reports/cl-s1-d1-d1-m${nn}/report.json`, 'utf8'));
    const key = m => `${m.round}|${m.phase}|${m.name}|${m.from.col},${m.from.row}->${m.to.col},${m.to.row}|${m.charged}`;
    const ck = c => `${c.round}|${c.phase}|${c.kind}|${c.attacker && c.attacker.name}|${c.target && c.target.name}|${JSON.stringify((c.losses || []).map(l => l.lost))}`;
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const mv = same(orig.moves.map(key), report.moves.map(key));
    const cb = same(orig.combats.map(ck), report.combats.map(ck));
    const res = JSON.stringify(orig.result) === JSON.stringify(report.result);
    console.log(`m${nn} replay matches: moves ${mv} (${orig.moves.length}/${report.moves.length}), combats ${cb} (${orig.combats.length}/${report.combats.length}), result ${res} ${JSON.stringify(report.result)}`);
  } finally {
    await recorder.stop();
  }
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
