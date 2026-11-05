// Replays one battle and, when the page's main thread stops answering, pauses it in the
// debugger and prints the JS stack, a few times, so a hang shows where it loops.
// Usage: node hang_probe.cjs <faction/formation A> <faction/formation B> <seed> [map]
const path = require('path');
const REPO = '/home/user/warfront';
const { recordBattle, startRecorder, parseSide } = require(path.join(REPO, 'scripts/battle_report/record.cjs'));

const [a, b, seed, map] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const recorder = await startRecorder();
  const harness = recorder.harness;
  let page = null;
  const newPage = harness.newPage.bind(harness);
  harness.newPage = async (...args) => {
    page = await newPage(...args);
    const onEvent = page._onEvent.bind(page);
    page._onEvent = msg => {
      if (msg.method === 'Debugger.paused') page.__paused = msg.params;
      else if (msg.method === 'Debugger.scriptParsed') (page.__scripts = page.__scripts || {})[msg.params.scriptId] = msg.params.url;
      onEvent(msg);
    };
    await page.send('Debugger.enable');
    return page;
  };
  let done = false;
  const battle = recordBattle(harness, {
    a: parseSide(a), b: parseSide(b), seed: Number(seed), map: map || 'CROSSROADS',
    noDoctrine: true, images: false, log: line => console.log('[battle]', line),
  }).then(r => { done = true; console.log('battle finished', r && r.result && JSON.stringify(r.result).slice(0, 200)); },
    err => { done = true; console.log('battle error', err.message); });
  let samples = 0;
  while (!done && samples < 8) {
    await sleep(samples ? 2500 : 5000);
    if (!page) continue;
    try {
      await page.send('Runtime.evaluate', { expression: '1', returnByValue: true }, samples ? 2000 : 8000);
    } catch (err) {
      console.log(`main thread busy (${err.message}): pausing`);
      page.__paused = null;
      await page.send('Debugger.pause', {}, 10000).catch(e => console.log('pause failed', e.message));
      for (let i = 0; i < 50 && !page.__paused; i++) await sleep(200);
      const p = page.__paused;
      if (!p) { console.log('no pause event'); continue; }
      samples++;
      console.log(`--- sample ${samples} ---`);
      const fr = p.callFrames.map(f => `  ${f.functionName || '(anon)'}  :${f.location.lineNumber + 1}`);
      console.log(`  (${fr.length} frames) top:`);
      console.log(fr.slice(0, 12).join('\n'));
      console.log('  ... bottom:');
      console.log(fr.slice(-30).join('\n'));
      await page.send('Debugger.resume', {}, 10000).catch(() => {});
      }
  }
  await recorder.stop();
  process.exit(0);
})();
