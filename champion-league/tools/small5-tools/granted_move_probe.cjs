// Browser check (round 4, item 3): every kind of granted move is animated ONCE.
// Usage: node granted_move_probe.cjs <url of warfront-fantasy.html> <png prefix>
// Drives a human seat (canvas clicks on the highlighted squares) and an AI seat
// through a plain granted reposition, a granted FALL BACK and a granted CHARGE,
// counting presentMovementAnimation calls and the 2D animations they start.
'use strict';
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const URL = process.argv[2];
const PNG = process.argv[3] || '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/small5-tools/shot';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1900, height: 1300 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  const served = [];
  page.on('response', (r) => { if (/\.html/.test(r.url())) served.push(r.status() + ' ' + r.url()); });

  await page.goto(URL, { waitUntil: 'load', timeout: 400000 });
  await page.waitForFunction(() => typeof G !== 'undefined' && typeof startTestArena === 'function'
    && typeof UNITS_DATA !== 'undefined', null, { timeout: 180000 });
  await sleep(1500);
  const basics = await page.evaluate(() => ({
    title: document.title,
    canvas: !!document.querySelector('canvas'),
    weaponPicker: !!document.getElementById('weapon-picker'),
    r3d: !!(typeof _r3d !== 'undefined' && _r3d && _r3d.active),
  }));
  console.log('SERVED', JSON.stringify(served));
  console.log('BASICS', JSON.stringify(basics));

  // Count every move animation: the presentation call and the 2D animation it starts,
  // with whether that animation ran to its end or was cut short by another.
  await page.evaluate(() => {
    window.__anim = [];
    const origPresent = presentMovementAnimation;
    presentMovementAnimation = function(unit, path) {
      window.__anim.push({ kind: 'present', uid: unit && unit.uid, from: path && path[0], to: path && path[path.length - 1], steps: path ? path.length : 0 });
      return origPresent.apply(this, arguments);
    };
    const orig2D = _animateMovement2D;
    _animateMovement2D = function(unit, path) {
      const rec = { kind: '2d', uid: unit && unit.uid, frames: 0, done: false };
      window.__anim.push(rec);
      const origRaf = window.requestAnimationFrame;
      const p = orig2D.apply(this, arguments);
      p.then(() => { rec.done = true; });
      return p;
    };
    // Frames drawn while a unit is between squares (a visual position held).
    window.__frames = 0;
    const origDraw = drawBoard;
    drawBoard = function() {
      if (typeof _movementVisualPositions !== 'undefined' && Object.keys(_movementVisualPositions).length) window.__frames++;
      return origDraw.apply(this, arguments);
    };
  });

  const tplId = (name) => page.evaluate((n) => Object.keys(UNITS_DATA).find((k) => k === n || k.endsWith(':' + n)), name);

  async function setupArena(vsAI) {
    await page.evaluate((ai) => {
      startTestArena();
      const panel = document.getElementById('arena-panel');
      if (panel) panel.classList.add('hidden');
      G.vsAI = !!ai; G.aiVsAi = false; G.aiPlayer = 1; AI.enabled = !!ai;
      G.round = 2; G.battlePhase = 'ACTION'; G.activePlayer = 0;
      G.pendingRepositions = []; G.pendingInterjection = null; G.pendingMoveOrders = null;
      G.units = [];
      window.__anim.length = 0; window.__frames = 0;
    }, vsAI);
  }

  async function place(name, player, col, row) {
    const id = await tplId(name);
    if (!id) throw new Error('no template ' + name);
    return page.evaluate(([tid, p, c, r]) => {
      const u = createUnit(tid, p);
      placeFootprint(u, c, r);
      G.units.push(u);
      if (typeof recomputeRerollMods === 'function') recomputeRerollMods(u);
      u.ap = 2; u.moved = false; u.attacked = false; u.usedAction = false;
      if (typeof updateAll === 'function') updateAll();
      drawBoard();
      return u.uid;
    }, [id, player, col, row]);
  }

  // Click (col,row) on the 2D board canvas, as a player does.
  async function clickSquare(col, row) {
    const at = await page.evaluate(([c, r]) => {
      const canvas = document.getElementById('board-canvas');
      canvas.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (c + 0.5) * CELL, y: rect.top + (r + 0.5) * CELL, inView: rect.top + (r + 0.5) * CELL < window.innerHeight };
    }, [col, row]);
    if (at.inView) await page.mouse.click(at.x, at.y);
    else {
      await page.evaluate(([x, y]) => {
        document.getElementById('board-canvas').dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
      }, [at.x, at.y]);
    }
  }

  async function pending() {
    return page.evaluate(() => {
      const p = G.pendingInterjection;
      const prompt = document.getElementById('reaction-prompt');
      return p ? { seam: p.seamId, player: p.player, squares: (p.candidates || []).filter((c) => c.square).map((c) => c.square),
        buttons: Array.from(document.querySelectorAll('#reaction-btns button')).map((b) => b.textContent),
        promptShown: !!(prompt && !prompt.classList.contains('hidden')), desc: (document.getElementById('reaction-desc') || {}).innerText }
        : null;
    });
  }

  async function settle(ms) {
    const until = Date.now() + (ms || 4000);
    while (Date.now() < until) {
      const busy = await page.evaluate(() => !!G.movementAnimationPending || !!(typeof CombatFX !== 'undefined' && CombatFX.busy && CombatFX.busy()));
      if (!busy) break;
      await sleep(100);
    }
    await sleep(400);
  }

  async function state(uid) {
    return page.evaluate((id) => {
      const u = G.units.find((x) => x.uid === id);
      const prompt = document.getElementById('reaction-prompt');
      return {
        at: u ? [u.col, u.row] : null, alive: u ? u.alive : null,
        pendingInterjection: G.pendingInterjection ? G.pendingInterjection.seamId : null,
        pendingRepositions: (G.pendingRepositions || []).length,
        animPending: !!G.movementAnimationPending, animPromise: !!G.movementAnimationPromise,
        promptHidden: !!(prompt && prompt.classList.contains('hidden')),
        anim: window.__anim.slice(), frames: window.__frames,
        log: (G.combatLog || []).slice(-6).map((l) => (typeof l === 'string' ? l : (l.text || l.msg || JSON.stringify(l))).slice(0, 140)),
      };
    }, uid);
  }

  // Answer whatever the other (human) player is asked on the way (an OVERWATCH): PASS.
  async function passOthers(owner) {
    for (let i = 0; i < 8; i++) {
      const p = await pending();
      if (!p || p.player === owner) return;
      console.log('  other decision: ' + p.seam + ' for player ' + p.player + ' buttons=' + JSON.stringify(p.buttons));
      await page.evaluate(() => passInterjection());
      await settle(3000);
    }
  }

  const results = [];
  async function scenario(label, fn) {
    try {
      const r = await fn();
      const presents = r.anim.filter((a) => a.kind === 'present').length;
      const twoD = r.anim.filter((a) => a.kind === '2d');
      const line = { label, presents, animations2D: twoD.length, ranToEnd: twoD.filter((a) => a.done).length,
        framesBetweenSquares: r.frames, at: r.at, moved: r.moved, pendingInterjection: r.pendingInterjection,
        pendingRepositions: r.pendingRepositions, animPending: r.animPending, promptHidden: r.promptHidden };
      results.push(line);
      console.log('RESULT', JSON.stringify(line));
      if (r.log) console.log('  log: ' + JSON.stringify(r.log));
    } catch (e) {
      results.push({ label, error: String(e && e.stack || e) });
      console.log('ERROR', label, e && e.stack || e);
    }
  }

  // 1. Human seat, plain granted reposition, the whole flow: the Stormrider's ranged
  //    attack (orderAttack, the browser's attack order) grants Ride-By Fire, the
  //    after-action flow puts it to its player as a square pick, the player clicks.
  await scenario('human: plain reposition (Ride-By Fire after a real ranged attack)', async () => {
    await setupArena(false);
    const rider = await place('stormrider', 0, 4, 12);
    const foe = await place('legionnaire_squad', 1, 4, 9);
    await page.evaluate(([r, f]) => {
      const a = G.units.find((u) => u.uid === r), t = G.units.find((u) => u.uid === f);
      orderAttack(a, t, Weapons.groups(a, 'ranged'));
    }, [rider, foe]);
    let p = null, clicks = 0;
    for (let i = 0; i < 100; i++) {
      p = await pending();
      if (p && p.seam === 'reposition') break;
      // The dice overlay waits on the player's click, layer by layer: click it through.
      const dice = await page.evaluate(() => { const o = document.getElementById('dice-roll-anim-overlay'); return !!(o && !o.classList.contains('hidden')); });
      if (dice) { clicks++; await page.click('#dice-roll-anim-overlay'); }
      await sleep(300);
    }
    if (!p || p.seam !== 'reposition') throw new Error('no reposition prompt: ' + JSON.stringify(p) + ' ' + JSON.stringify(await state(rider)));
    console.log('  dice overlay clicks: ' + clicks);
    console.log('  prompt: ' + p.desc.replace(/\n/g, ' ') + ' | shown=' + p.promptShown + ' squares=' + p.squares.length);
    await page.screenshot({ path: PNG + '-plain-prompt.png' });
    await page.evaluate(() => { window.__anim.length = 0; window.__frames = 0; });
    const sq = p.squares[0];
    await clickSquare(sq.col, sq.row);
    await settle(5000);
    const s = await state(rider);
    s.moved = s.at && s.at[0] === sq.col && s.at[1] === sq.row;
    await page.screenshot({ path: PNG + '-plain-after.png' });
    return s;
  });

  // 2. Human seat, granted FALL BACK (Break and Ride's own effect on the Azat Lancers),
  //    put to its player by the queue the flow offers (offerRepositions).
  await scenario('human: granted Fall Back (Break and Ride)', async () => {
    await setupArena(false);
    const lancers = await place('azat_lancers', 0, 8, 10);
    await place('legionnaire_squad', 1, 8, 9);
    await page.evaluate((id) => {
      const u = G.units.find((x) => x.uid === id);
      const effect = ABILITIES_DATA && ABILITIES_DATA.break_and_ride ? ABILITIES_DATA.break_and_ride.effects[0]
        : { op: 'grant_move', target: 'self', fraction: 0.5, as_fall_back: true, reason: 'BREAK AND RIDE' };
      runOp(effect, { unit: u, targets: [u], source: 'break_and_ride' });
      window.__settled = false;
      offerRepositions(function() { window.__settled = true; });
    }, lancers);
    const p = await pending();
    if (!p || p.seam !== 'reposition') throw new Error('no reposition prompt: ' + JSON.stringify(p));
    console.log('  prompt: ' + p.desc.replace(/\n/g, ' ') + ' | shown=' + p.promptShown + ' squares=' + p.squares.length);
    await page.evaluate(() => { window.__anim.length = 0; window.__frames = 0; });
    const sq = p.squares[p.squares.length - 1];
    await clickSquare(sq.col, sq.row);
    await settle(5000);
    const s = await state(lancers);
    s.moved = s.at && s.at[0] === sq.col && s.at[1] === sq.row;
    s.settled = await page.evaluate(() => window.__settled);
    console.log('  queue settled: ' + s.settled + ', fellBackThisRound: ' + await page.evaluate((id) => !!G.units.find((x) => x.uid === id).fellBackThisRound, lancers));
    return s;
  });

  // 3. Human seat, granted CHARGE (Insatiable Rage's own effect on the Furyforged
  //    Berserkers): the Countercharge offer, the move, OVERWATCH (the enemy's player
  //    PASSes it), Fire After Enemy Charge.
  await scenario('human: granted Charge (Insatiable Rage)', async () => {
    await setupArena(false);
    const zerk = await place('furyforged_berserkers', 0, 10, 12);
    await place('legionnaire_squad', 1, 10, 8);
    await page.evaluate((id) => {
      const u = G.units.find((x) => x.uid === id);
      runOp({ op: 'grant_move', target: 'self', fraction: 1, compulsory: true, toward: 'closest_enemy', as_charge: true, reason: 'INSATIABLE RAGE' },
        { unit: u, targets: [u], source: 'insatiable_rage' });
      window.__settled = false;
      offerRepositions(function() { window.__settled = true; });
    }, zerk);
    const p = await pending();
    if (!p || p.seam !== 'reposition') throw new Error('no reposition prompt: ' + JSON.stringify(p));
    console.log('  prompt: ' + p.desc.replace(/\n/g, ' ') + ' | shown=' + p.promptShown + ' squares=' + p.squares.length + ' buttons=' + JSON.stringify(p.buttons));
    await page.evaluate(() => { window.__anim.length = 0; window.__frames = 0; });
    const sq = p.squares[0];
    await clickSquare(sq.col, sq.row);
    await settle(4000);
    await passOthers(0);
    await settle(4000);
    const s = await state(zerk);
    s.moved = s.at && s.at[0] === sq.col && s.at[1] === sq.row;
    s.settled = await page.evaluate(() => window.__settled);
    console.log('  queue settled: ' + s.settled + ', charged: ' + await page.evaluate((id) => hasChargedThisRound(G.units.find((x) => x.uid === id)), zerk));
    return s;
  });

  // 4-6. AI seat (player 1 under the AI): the AI answers the same decision (aiChoose).
  //      A plain grant made compulsory so the AI must move; Break and Ride; Insatiable Rage.
  const aiCase = async (label, unitName, foeAt, effect) => {
    await scenario(label, async () => {
      await setupArena(true);
      const u = await place(unitName, 1, 9, 5);
      await place('legionnaire_squad', 0, foeAt[0], foeAt[1]);
      const before = await state(u);
      await page.evaluate(([id, eff]) => {
        const unit = G.units.find((x) => x.uid === id);
        runOp(eff, { unit: unit, targets: [unit], source: 'probe' });
        window.__anim.length = 0; window.__frames = 0;
        window.__settled = false;
        offerRepositions(function() { window.__settled = true; });
      }, [u, effect]);
      await settle(5000);
      const s = await state(u);
      s.moved = !!(s.at && before.at && (s.at[0] !== before.at[0] || s.at[1] !== before.at[1]));
      s.settled = await page.evaluate(() => window.__settled);
      console.log('  queue settled: ' + s.settled + ', from ' + JSON.stringify(before.at) + ' to ' + JSON.stringify(s.at));
      return s;
    });
  };
  await aiCase('AI: plain reposition (compulsory)', 'stormrider', [9, 10],
    { op: 'grant_move', target: 'self', fraction: 0.5, compulsory: true, reason: 'RIDE-BY FIRE' });
  await aiCase('AI: granted Fall Back (Break and Ride, compulsory)', 'azat_lancers', [9, 6],
    { op: 'grant_move', target: 'self', fraction: 0.5, as_fall_back: true, compulsory: true, reason: 'BREAK AND RIDE' });
  await aiCase('AI: granted Charge (Insatiable Rage)', 'furyforged_berserkers', [9, 9],
    { op: 'grant_move', target: 'self', fraction: 1, compulsory: true, toward: 'closest_enemy', as_charge: true, reason: 'INSATIABLE RAGE' });

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  console.log('SUMMARY', JSON.stringify(results));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
