#!/usr/bin/env node
'use strict';
// Scratch (aiact): replay one Day 1 battle from its seed through Round N in the built
// page WARFRONT_OUTPUT_DIR serves, with the battle recorder (lean) and an optional page
// probe, then write moves/activity/probe for rounds <= N.
//   node probe.cjs --nn 01 --rounds 1 --out <file.json> [--inject a.js,b.js] [--probe page.js] [--probe-arg JSON]
const fs = require('fs');
const path = require('path');
const REPO = '/home/user/warfront/.claude/worktrees/agent-ae4a7dae569075090';
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const { startRecorder } = require(REPO + '/scripts/battle_report/record.cjs');
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, acknowledgeDice } = require(REPO + '/scripts/battle_report/skirmish_driver.cjs');
const { sleep } = require(REPO + '/scripts/lib/game_process.cjs');

const args = {};
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) { const k = av[i].replace(/^--/, ''); args[k] = av[i + 1]; i++; }
const nn = args.nn;
const maxRound = Number(args.rounds || 1);
const state = JSON.parse(fs.readFileSync(S + '/cl-shadow2/tournaments/cl-s1/state.json', 'utf8'));
const match = state.days[0].matches.find(m => m.id === 'D1-M' + nn);
const BR = REPO + '/scripts/battle_report/';
const RECORDER = ['page_recorder.js', 'page_activity.js'].map(f => fs.readFileSync(BR + f, 'utf8')).join('\n');
const injects = (args.inject ? args.inject.split(',') : []).map(f => fs.readFileSync(f, 'utf8'));
const probe = args.probe ? fs.readFileSync(args.probe, 'utf8') : null;

(async () => {
  const recorder = await startRecorder({});
  const page = await recorder.harness.newPage('/fantasy', 'probe');
  const t0 = Date.now();
  try {
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${Number(match.seed)})`);
    await page.eval(`setAiDecisionThread('main')`);
    for (const src of injects) await page.eval(src + '\n;true');
    await page.eval(`${RECORDER}\ninstallBattleRecorder({ images: false }); installActivityRecorder(window.__battleRecord)`);
    if (probe) console.log('probe:', await page.eval(`${probe}\n;installProbe(${args['probe-arg'] || 'null'})`));
    await chooseSkirmishAndMap(page, state.config.map);
    const order = await rollOff(page);
    const sides = [match.a, match.b].map(s => ({ faction: s.faction, formation: s.formation }));
    await page.eval(`(${JSON.stringify(sides)}).forEach(s => { const e = _aiFormationEntry(s.faction, s.formation); e.doctrineId = FORMATION_NO_DOCTRINE; })`);
    await pickFormations(page, order, sides);
    await page.waitFor(`G.phase === 'BATTLE'`, 180000);
    let last = '';
    let movedAt = Date.now();
    for (;;) {
      const s = await page.eval(`({ round: G.round, bp: G.battlePhase, ai: !!G.aiActing, pend: !!G.pendingInterjection, over: !!(window.__battleRecord && window.__battleRecord.result), p: window.__battleRecord.seq })`);
      if (s.over || s.round > maxRound) break;
      const key = s.round + s.bp + s.p;
      if (key !== last) { last = key; movedAt = Date.now(); }
      if (Date.now() - movedAt > 180000) throw new Error('stalled in round ' + s.round + ' ' + s.bp);
      await acknowledgeDice(page);
      if (s.bp === 'CLEANUP' && !s.ai && !s.pend) {
        if (s.round >= maxRound) { await page.eval(`window.__battleRecord.noteIdle && window.__battleRecord.noteIdle()`); break; }
        await page.eval(`(() => { const b = document.getElementById('btn-end-phase'); if (b && G.battlePhase === 'CLEANUP' && !G.aiActing) b.click(); })()`);
      }
      await sleep(300);
    }
    const out = await page.eval(`(() => {
      const R = window.__battleRecord;
      const lim = ${maxRound};
      return {
        moves: R.moves.filter(m => m.round <= lim),
        activity: (R.activity || []).filter(a => a.round <= lim).map(a => ({ round: a.round, phase: a.phase, uid: a.uid, player: a.player, kind: a.kind, why: a.why || null })),
        units: G.units.filter(u => !isStructure(u)).map(u => ({ uid: u.uid, name: u.name, player: u.player, alive: u.alive, col: u.col, row: u.row, joined: isJoined(u), character: (u.tags || []).indexOf('CHARACTER') >= 0, caster: (u.tags || []).indexOf('MAGIC_CASTER') >= 0 })),
        probe: window.__probe || null,
        vp: G.players.map(p => p.vp || 0),
        log: (G.combatLog || []).filter(e => e.round <= lim).map(e => e.round + ' ' + e.phase + ' ' + e.msg),
      };
    })()`, 300000);
    out.seconds = Math.round((Date.now() - t0) / 1000);
    out.errors = (page.logs || []).filter(l => l.type === 'error' || /Error/.test(l.text || '')).map(l => l.text).slice(0, 20);
    fs.writeFileSync(args.out, JSON.stringify(out, null, 1));
    console.log(`m${nn} rounds<=${maxRound}: moves ${out.moves.length}, activity ${out.activity.length}, ${out.seconds}s, errors ${out.errors.length}`);
  } finally {
    await page.close();
    await recorder.stop();
  }
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
