'use strict';
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1900, height: 1300 } });
  page.on('pageerror', (e) => console.log('pageerror: ' + e.message));
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 400000 });
  await page.waitForFunction(() => typeof G !== 'undefined' && typeof startTestArena === 'function', null, { timeout: 180000 });
  const out = await page.evaluate(() => {
    startTestArena();
    G.vsAI = false; AI.enabled = false; G.round = 2; G.battlePhase = 'ACTION'; G.activePlayer = 0; G.units = [];
    const tid = (n) => Object.keys(UNITS_DATA).find((k) => k.endsWith(':' + n));
    const a = createUnit(tid('stormrider'), 0); placeFootprint(a, 4, 12); G.units.push(a); a.ap = 2;
    const t = createUnit(tid('legionnaire_squad'), 1); placeFootprint(t, 4, 9); G.units.push(t);
    const groups = Weapons.groups(a, 'ranged');
    const act = browserAction('attack', attackAction(a, t, groups[0].weapon, { groupKeys: groups.map((g) => g.key) }));
    const can = canAttack(a, t, {});
    const refused = dispatchAction(act);
    return { groups: groups.map((g) => g.key + ' ' + (g.weapon && g.weapon.name)), act, can, refused,
      abilities: (a.abilities || []).map((x) => x.ability_id || x.id || x), pending: (G.pendingRepositions || []).length,
      interj: G.pendingInterjection && G.pendingInterjection.seamId,
      log: G.combatLog.slice(-8).map((l) => (typeof l === 'string' ? l : (l.text || JSON.stringify(l))).slice(0, 120)) };
  });
  console.log(JSON.stringify(out, null, 1));
  await new Promise((r) => setTimeout(r, 8000));
  console.log(JSON.stringify(await page.evaluate(() => ({ interj: G.pendingInterjection && G.pendingInterjection.seamId,
    pend: (G.pendingRepositions || []).length,
    log: G.combatLog.slice(-8).map((l) => (typeof l === 'string' ? l : (l.text || JSON.stringify(l))).slice(0, 120)) }))));
  await page.screenshot({ path: '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/small5-tools/dbg.png' });
  console.log(JSON.stringify(await page.evaluate(() => ({
    visible: Array.from(document.querySelectorAll('button')).filter((b) => b.offsetParent && b.getBoundingClientRect().width > 0).map((b) => (b.id || '') + ':' + b.textContent.trim().slice(0, 30)).slice(0, 40),
    frame: typeof _actionFrame !== 'undefined' ? String(_actionFrame) : 'n/a',
    aiActing: G.aiActing, animPending: G.movementAnimationPending, decided: battleDecided(), rollQ: getRollPresentationQueueState(), fx: typeof CombatFX.busy === 'function' ? CombatFX.busy() : 'n/a', phase: G.phase, gameMode: G.gameMode, holds: PhaseHost.holdsTurn(),
  }))));
  await browser.close();
})();
