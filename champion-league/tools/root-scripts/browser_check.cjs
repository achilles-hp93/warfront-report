// Browser check: Troop Requisition RP pricing and the 250 RP cap, in the built game.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');

const OUT = path.dirname(__filename);
const URL = 'http://127.0.0.1:8781/warfront-fantasy.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  const served = [];
  page.on('response', (r) => served.push(r.status() + ' ' + r.url()));

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof G !== 'undefined' && typeof HQ_DATA !== 'undefined' && typeof startTestArena === 'function', null, { timeout: 120000 });
  await page.waitForTimeout(1500);

  const basics = await page.evaluate(() => ({
    title: document.title,
    canvas: !!document.querySelector('canvas'),
    weaponPicker: !!document.getElementById('weapon-picker'),
    maxRp: ARMY_RULES.maxRp,
    bands: troopRequisitionCostBands(),
  }));
  console.log('BASICS', JSON.stringify(basics));

  // A battle's Command Phase: the Test Arena, player 0 an Iron Imperium seat with its HQ
  // in its deployment zone.
  const setup = await page.evaluate(() => {
    startTestArena();
    const panel = document.getElementById('arena-panel');
    if (panel) panel.classList.add('hidden');
    G.players[0].factionId = 'iron_imperium';
    G.players[1].factionId = 'mat_akkadi';
    G.players[0].cp = 6;
    G.players[0].commandsUsedThisPhase = [];
    G.players[0].commandsIssuedThisPhase = 0;
    G.battlePhase = 'COMMAND';
    G.round = 2;
    const hq = createUnit('hq', 0, true);
    hq.isHQ = true;
    const sq = troopRequisitionSquares(0)[0];
    placeFootprint(hq, sq.col, sq.row);
    G.units.push(hq);
    if (typeof updateAll === 'function') updateAll();
    drawBoard();
    return { hqUid: hq.uid, at: sq, offered: troopRequisitionTemplates(0).length };
  });
  console.log('SETUP', JSON.stringify(setup));

  // The HQ command panel and the Troop Requisition tag's tooltip.
  const panelInfo = await page.evaluate((uid) => {
    const hq = G.units.find((u) => u.uid === uid);
    showHQCommands(hq);
    const tags = Array.from(document.querySelectorAll('#overlay-panel .hq-tag.t-requisition'));
    return {
      overlayVisible: !document.getElementById('overlay').classList.contains('hidden'),
      tooltip: tags.map((t) => t.getAttribute('title')),
      text: (document.getElementById('overlay-panel').innerText || '').slice(0, 1500),
    };
  }, setup.hqUid);
  console.log('PANEL', JSON.stringify(panelInfo));
  await page.screenshot({ path: path.join(OUT, 'hq_panel.png') });

  // Hover the requisition tag so the native tooltip is at least targeted (title attr checked above).
  // Open the Troop Requisition picker through the command panel's own flow.
  const picker = await page.evaluate(() => {
    const idx = getAvailableHQCommands(0).findIndex((c) => c.name === 'Troop Requisition');
    issueHQCommand(0, idx);
    const options = Array.from(document.querySelectorAll('#overlay-panel .gear-option')).map((el) => ({
      name: el.querySelector('.gear-option-name').innerText,
      cost: (el.innerText.match(/COST: (\d+) CP/) || [])[1],
      disabled: (el.getAttribute('style') || '').indexOf('pointer-events:none') >= 0,
    }));
    const faction = getPlayerFactionId(0);
    const expected = troopRequisitionTemplates(0).map((tid) => ({ tid, name: UNITS_DATA[tid].name, rp: UNITS_DATA[tid].rp, cp: troopRequisitionTemplateCost(UNITS_DATA[tid]) }));
    const excluded = Object.keys(UNITS_DATA).filter((tid) => {
      const t = UNITS_DATA[tid];
      return templateFactionId(t) === faction && !t.tags.includes('BUILDING') && !t.tags.includes('STRUCTURE');
    }).filter((tid) => !troopRequisitionTemplates(0).includes(tid))
      .map((tid) => ({ tid, rp: UNITS_DATA[tid].rp, tier: unitTier(UNITS_DATA[tid]) }));
    return { sub: document.querySelector('#overlay-panel .overlay-sub').innerText, options, expected, excluded };
  });
  console.log('PICKER', JSON.stringify(picker, null, 1));
  await page.screenshot({ path: path.join(OUT, 'requisition_picker.png') });
  await page.evaluate(() => _cancelTroopRequisition());

  // The formation screen: a small Iron Imperium deck, its budget line.
  const formation = await page.evaluate(() => {
    formationState = {
      player: 0, deck: [UNITS_DATA['iron_imperium:legionnaire_squad'], UNITS_DATA['iron_imperium:speculatores']],
      gearMap: {}, transportMap: {}, leaderMap: {}, marshalIndex: null,
      factionId: 'iron_imperium', subfactionId: null, doctrineId: null, devMode: false,
      poolFilter: 'ALL', doctrineDetailCollapsed: true, stage: 'roster',
    };
    showFormationOverlay(0);
    document.getElementById('overlay').classList.remove('hidden');
    const text = document.getElementById('overlay-panel').innerText || '';
    return { budget: (text.match(/Budget: \d+ \/ \d+ RP[^\n]*/) || [])[0], has250: /\/\s*250\s*RP/.test(text) };
  });
  console.log('FORMATION', JSON.stringify(formation));
  await page.screenshot({ path: path.join(OUT, 'formation_screen.png') });

  // The Armory's build tab.
  const armory = await page.evaluate(() => {
    showArmory(true);
    _armoryState.tab = 'build';
    _renderArmory();
    document.getElementById('overlay').classList.remove('hidden');
    const text = document.getElementById('overlay-panel').innerText || '';
    return { rp: (text.match(/\d+ \/ \d+ RP/) || [])[0], has250: /\/\s*250\s*RP/.test(text) };
  });
  console.log('ARMORY', JSON.stringify(armory));
  await page.screenshot({ path: path.join(OUT, 'armory_build.png') });

  console.log('SERVED', JSON.stringify(served.filter((s) => /warfront-fantasy\.html/.test(s))));
  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
