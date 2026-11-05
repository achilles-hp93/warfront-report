'use strict';
// A human seat answers a granted Charge's Reactions in the browser: the real page, the
// browser MoveHost (the move is animated first), the prompts in the DOM.
// node granted_charge_browser.cjs  (WARFRONT_OUTPUT_DIR, CHROME_PATH set)
const REPO = '/home/user/warfront/.claude/worktrees/agent-ade43744e9dea60b8';
const { startOutputServer, startChrome, BrowserQaHarness, assertNoBadLogs } = require(REPO + '/scripts/browser_qa/common_cdp.cjs');
const { newFantasyPage } = require(REPO + '/scripts/browser_qa/fantasy/page.cjs');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function state(page) {
  return page.eval(`(() => {
    var p = G.pendingInterjection;
    var mob = G.units.find(function(u) { return u.uid === G.__qaMob; });
    var prompt = document.getElementById('reaction-prompt');
    return {
      seam: p ? p.seamId : null, player: p ? p.player : null,
      promptVisible: !!prompt && !prompt.classList.contains('hidden'),
      promptText: (document.getElementById('reaction-desc') || {}).innerText || '',
      mob: mob ? [mob.col, mob.row] : null, charged: mob ? hasChargedThisRound(mob) : null,
      continued: !!G.__qaContinued, animating: !!G.movementAnimationPending, alive: mob ? mob.alive : null, log: window.__qaLog ? window.__qaLog.slice(-12) : null,
    };
  })()`);
}

(async () => {
  const server = await startOutputServer();
  const chrome = await startChrome();
  const harness = new BrowserQaHarness(server.baseUrl, chrome.browserWsUrl);
  const out = [];
  try {
    const page = await newFantasyPage(harness, 'granted-charge');
    const setup = await page.eval(`(() => {
      var qa = window.__wfFantasyQa;
      qa.reset();
      G.round = 2; G.vsAI = false; G.aiVsAi = false; AI.enabled = false;
      var mob = qa.placeUnit('iron_imperium:legionnaire_squad', 0, 5, 3, {});
      var levies = qa.placeUnit('covenant_of_new_jerusalem:covenant_levies', 1, 5, 7, {});
      var watcher = qa.placeUnit('iron_imperium:legionnaire_squad', 1, 8, 7, {});
      var reserve = qa.placeUnit('iron_imperium:legionnaire_squad', 1, 10, 4, {});
      var hq = createUnit('hq', 1, true); hq.isHQ = true; hq.col = 10; hq.row = 6; hq.deployed = true; G.units.push(hq);
      G.players[1].cp = 5; G.players[1].commandsUsedThisPhase = [];
      var u = function(s) { return G.units.find(function(x) { return x.uid === s.uid; }); };
      markRound(u(watcher), 'overwatch_ready');
      runOp({ op: 'fire_after_enemy_charge', target: 'self' }, { unit: u(reserve), targets: [u(reserve)], source: 'probe' });
      runOp({ op: 'grant_move', compulsory: true, toward: 'closest_enemy', as_charge: true, fraction: 1, reason: 'PROBE RAGE' },
        { unit: u(mob), targets: [u(mob)], source: 'probe' });
      G.__qaMob = mob.uid; G.__qaContinued = false;
      updateAll();
      var took = offerRepositions(function() { G.__qaContinued = true; });
      var p = G.pendingInterjection;
      return { took: took, seam: p && p.seamId, squares: p ? p.candidates.map(function(c) { return c.square; }) : [] };
    })()`);
    out.push(['setup', setup]);
    await page.eval(`resolveInterjectionSquare(5, 6)`);
    await wait(600);
    let s = await state(page); out.push(['after square pick', s]);
    for (let i = 0; i < 6 && s.seam; i++) { if (s.seam === "overwatch") { await page.eval(`(() => { var m = G.units.find(function(u) { return u.uid === G.__qaMob; }); m.models = [m.models[0]]; m.models[0].hp = 1; Models.projectCompatibility(m); m.hp = 1; window.__savedRoll = rollDie; window.__savedDie = RULES_RANDOM.die; var n = 0; var face = function(s) { n++; return Math.min(s || 6, n <= 10 ? 6 : 1); }; rollDie = function() { return face(6); }; RULES_RANDOM.die = face; var p = G.pendingInterjection; resolveInterjection(p.candidates[0].id); rollDie = window.__savedRoll; RULES_RANDOM.die = window.__savedDie; window.__qaLog = (G.combatLog || []).slice(-25).map(function(e) { return typeof e === "string" ? e : (e.text || e.msg || JSON.stringify(e)); }); })()`); await wait(2500); s = await state(page); out.push(["after FIRE", s]); continue; }
      await page.eval(`passInterjection()`);
      await wait(2500);
      s = await state(page); out.push(['after pass ' + (i + 1), s]);
    }
    await wait(1500);
    s = await state(page); out.push(['final', s]);
    try { await assertNoBadLogs(page); out.push(['console', 'clean']); } catch (e) { out.push(['console', String(e.message || e)]); }
  } finally {
    console.log(JSON.stringify(out, null, 1));
    try { await harness.closePages(); harness.close(); } catch (_e) {}
    try { await chrome.stop(); } catch (_e) {}
    server.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
