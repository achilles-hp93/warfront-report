#!/usr/bin/env node
'use strict';
// A copy of scripts/battle_report/record.cjs's flow with one addition: --probe <page js>
// is evaluated in the page after the recorders, then installProbe(R, <--probe-args JSON>);
// R.probe is written into report.json. Run from the worktree root:
//   WARFRONT_OUTPUT_DIR=... node <this> --a .. --b .. --seed .. --map CROSSROADS --no-doctrine --name X --probe p.js --probe-args '{}'
const WT = process.env.WT || '/home/user/warfront/.claude/worktrees/cl-d1-ai-move';
const fs = require('fs');
const path = require('path');
const rec = require(path.join(WT, 'scripts/battle_report/record.cjs'));
const { FAST, chooseSkirmishAndMap, rollOff, pickFormations, playBattle } = require(path.join(WT, 'scripts/battle_report/skirmish_driver.cjs'));
const { badConsoleLogs } = require(path.join(WT, 'scripts/lib/cdp.cjs'));
const BR = path.join(WT, 'scripts/battle_report');
const EFFECTS_FILES = rec.EFFECTS_FILES;
const RECORDER = ['page_recorder.js','page_attribution.js','page_activity.js','page_fallback.js','page_effects_levers.js']
  .concat(EFFECTS_FILES).concat(['page_estimate.js','page_passives.js','page_transport.js','page_terrain.js','page_formations.js','page_ai_perf.js'])
  .map(f => fs.readFileSync(path.join(BR, f), 'utf8')).join('\n');
const INSTALL_FULL = 'installVpAttribution(window.__battleRecord); installActivityRecorder(window.__battleRecord); '
  + 'installFallBackRecorder(window.__battleRecord); installEffectsRecorder(window.__battleRecord); '
  + 'installPassivesRecorder(window.__battleRecord); installTransportRecorder(window.__battleRecord); '
  + 'installTerrainRecorder(window.__battleRecord); installFormationsRecorder(window.__battleRecord); '
  + 'installAiPerfRecorder(window.__battleRecord)';
const META = `((sides) => ({
  map: G.mapName, mode: G.skirmishMode, deployment: G.deploymentType || null, initiative: G.initiative,
  formationOrder: G.formationOrder,
  factions: [0, 1].map(p => (G.formations[p] || {}).factionId),
  factionNames: [0, 1].map(p => _getFactionName((G.formations[p] || {}).factionId)),
  armyNames: sides.map(s => (_aiFormationEntry(s.faction, s.formation) || {}).name || s.formation),
  doctrines: [0, 1].map(p => { const d = getDoctrineById((G.formations[p] || {}).doctrineId); return d ? d.name : null; }),
  armies: [0, 1].map(p => G.units.filter(u => u.player === p && !isStructure(u)).map(u => Object.assign(window.__battleRecord.unitInfo(u), {
    models: Models.alive(u).length, hp: unitCurrentHP(u), marshal: !!u.isMarshal,
    leads: u.joinedCharacter != null ? (unitByUid(u.joinedCharacter) || {}).name : null,
    joined: u.joinedSquad != null ? (unitByUid(u.joinedSquad) || {}).name : null }))),
}))`;
const RESULT = `(() => {
  const R = window.__battleRecord;
  return {
    result: R.result, snaps: R.snaps, moves: R.moves, combats: R.combats, resources: R.resources,
    primary: R.primary, missions: R.missions, attribution: R.attribution || null, activity: R.activity || null,
    fallBacks: R.fallBacks || null, uses: R.uses || null, passives: R.passives || null, aiPerf: R.aiPerf || null,
    transport: R.transport || null, terrain: R.terrain || null, formations: R.formations || null,
    log: (G.combatLog || []).map(e => ({ round: e.round, phase: e.phase, msg: e.msg, isPhase: !!e.isPhase })),
    units: G.units.filter(u => !isStructure(u)).map(u => Object.assign(R.unitInfo(u), { alive: !!u.alive, stats: u.battleStats || null })),
    probe: R.probe || null,
  };
})()`;
function parseArgs(argv) {
  const args = { images: false };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i]; const v = () => argv[++i];
    if (f === '--a') args.a = rec.parseSide(v(), '--a');
    else if (f === '--b') args.b = rec.parseSide(v(), '--b');
    else if (f === '--map') args.map = v();
    else if (f === '--seed') args.seed = Number(v());
    else if (f === '--name') args.name = v();
    else if (f === '--no-images') args.images = false;
    else if (f === '--no-doctrine') args.noDoctrine = true;
    else if (f === '--probe') args.probe = v();
    else if (f === '--probe-args') args.probeArgs = v();
    else if (f === '--lean') args.lean = true;
    else throw new Error('unknown flag ' + f);
  }
  return args;
}
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const recorder = await rec.startRecorder({});
  const t0 = Date.now();
  try {
    const page = await recorder.harness.newPage('/fantasy', 'battle-report');
    await page.waitFor(`document.body.classList.contains('app-ready') && !document.getElementById('boot-loading')`, 60000);
    await page.eval(`(${FAST})(${opts.seed == null ? 'null' : Number(opts.seed)})`);
    await page.eval(`setAiDecisionThread('main'); aiDecisionWorkerStats.verify = false`);
    await page.eval(`${RECORDER}\ninstallBattleRecorder(${JSON.stringify({ images: opts.images })}); ${opts.lean ? 'installActivityRecorder(window.__battleRecord); installAiPerfRecorder(window.__battleRecord); installFallBackRecorder(window.__battleRecord)' : INSTALL_FULL}`);
    if (opts.probe) {
      await page.eval(fs.readFileSync(opts.probe, 'utf8') + `\ninstallProbe(window.__battleRecord, ${opts.probeArgs || '{}'});`);
    }
    const map = await chooseSkirmishAndMap(page, opts.map);
    const order = await rollOff(page);
    if (opts.noDoctrine) {
      await page.eval(`(${JSON.stringify([opts.a, opts.b])}).forEach(s => {
        const entry = _aiFormationEntry(s.faction, s.formation);
        entry.doctrineId = FORMATION_NO_DOCTRINE;
      })`);
    }
    await pickFormations(page, order, [opts.a, opts.b]);
    await page.waitFor(`G.phase === 'BATTLE' && !!window.__battleRecord.snaps.length`, 180000);
    const meta = await page.eval(`(${META})(${JSON.stringify([opts.a, opts.b])})`);
    meta.sides = [opts.a, opts.b]; meta.seed = opts.seed; meta.mapRequested = opts.map || null;
    meta.recordedAt = new Date().toISOString(); meta.lean = !!opts.lean; meta.noDoctrine = !!opts.noDoctrine; meta.aiThread = 'main';
    console.log(`battle begins on ${map}`);
    await playBattle(page, { log: console.log });
    const report = await page.eval(RESULT, 120000);
    report.perf = null; report.aiDecisions = await page.eval('aiDecisionWorkerStats');
    report.meta = meta; report.errors = badConsoleLogs(page.logs).map(l => l.text).slice(0, 50);
    await page.close();
    const dir = rec.reportDir(opts.name);
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report));
    const r = report.result || {};
    console.log(`winner ${r.winner === 0 ? 'A' : r.winner === 1 ? 'B' : r.winner} in round ${r.round}, VP ${(r.vp || []).join(' / ')} (${Math.round((Date.now()-t0)/1000)}s)`);
    if (report.errors.length) console.log('page errors:', report.errors.slice(0, 10));
  } finally { await recorder.stop(); }
}
main().catch(err => { console.error(err.stack || err.message); process.exit(1); });
