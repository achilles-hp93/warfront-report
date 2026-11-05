// Debug: where does the worker's restored battle differ from the page's, by checksum snapshot?
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (!isMainThread) {
  globalThis.self = { postMessage: m => parentPort.postMessage(m) };
  vm.runInThisContext(workerData.source, { filename: 'ai-worker.js' });
  parentPort.on('message', data => {
    if (data.snapshot) {
      aiBattleRestore(data.request.battle);
      setAIWeights(data.request.weights.base, data.request.weights.overrides);
      aiMemoryGive(data.request.memory, true);
      parentPort.postMessage({ id: data.id, snapshot: buildBattleStateChecksumSnapshot(), checksum: getBattleStateChecksum() });
      return;
    }
    globalThis.self.onmessage({ data });
  });
  return;
}
const repo = process.argv[2];
const out = process.argv[3];
process.env.WARFRONT_OUTPUT_DIR = out;
const { GameSession } = require(path.join(repo, 'server/src/game_session.js'));
const html = fs.readFileSync(path.join(out, 'warfront-fantasy.html'), 'utf8');
const OPEN = '<script type="text/plain" id="ai-worker-engine">';
const at = html.indexOf(OPEN);
const source = html.slice(at + OPEN.length, html.indexOf('</script>', at));
const worker = new Worker(__filename, { workerData: { source } });
let resolveNext = null;
worker.on('message', m => { if (m.ready) return; resolveNext(m); });
const ask = msg => new Promise(r => { resolveNext = r; worker.postMessage(msg); });
(async () => {
  const session = new GameSession('x', { mapIdx: 2, deployType: 'central_faceoff', mode: 'skirmish', skirmishMode: 'seize_the_ground', skipChecksum: true, aiBothSides: true });
  session.initGame([{ templateId: 'hq', col: 2, row: 7, isHQ: true }, { templateId: 'atashid_empire:shieldbearers', col: 4, row: 6 }],
    [{ templateId: 'hq', col: 12, row: 7, isHQ: true }, { templateId: 'duat_dominion:skeletal_spearman', col: 10, row: 6 }],
    { factionId: 'atashid_empire' }, { factionId: 'duat_dominion' });
  session.beginFirstRound();
  const ctx = session.ctx;
  const request = ctx.aiDecisionRequest(session.activePlayer, [], true);
  const reply = await ask({ id: 1, snapshot: true, request });
  const mine = ctx.buildBattleStateChecksumSnapshot();
  console.log('page', ctx.getBattleStateChecksum(), 'worker', reply.checksum);
  const diffs = ctx.diffBattleStateSnapshots(mine, reply.snapshot, 30);
  console.log(JSON.stringify(diffs, null, 1).slice(0, 4000));
  await worker.terminate();
})();
