'use strict';
// The HIT number a melee strike needs against a Structure: node probe_structure.cjs <engine>
const fs = require('fs');
const vm = require('vm');
const sandbox = { console: { log() {}, warn() {}, error() {}, info() {}, debug() {} }, setTimeout, clearTimeout, setInterval, clearInterval, module: { exports: {} }, exports: {} };
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8'), ctx, { filename: 'warfront-engine.js' });
const E = sandbox.module.exports;
const get = n => vm.runInContext(n, ctx);
ctx.G = E.createGameState();
get('setBoardFromMap')({ grid: Array.from({ length: 12 }, () => Array(12).fill('open')), name: 'probe',
  board: { cols: 12, rows: 12, nml: { rowMin: 5, rowMax: 6 }, defaultDeployment: {
    A: { colMin: 0, colMax: 11, rowMin: 7, rowMax: 11 }, B: { colMin: 0, colMax: 11, rowMin: 0, rowMax: 4 } } } });
const G = get('G');
G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2;
const atk = E.createUnit('iron_imperium:legionnaire_squad', 0, false); atk.col = 5; atk.row = 5; G.units.push(atk);
const ids = Object.keys(get('STRUCTURES_DATA') || {});
const out = [];
ids.slice(0, 40).forEach(id => {
  try {
    const s = get('placeStructure')(get('addStructure')(get('createStructureBody')(id, 1)), { col: 5, row: 4 });
    const body = s && s.unit ? s.unit : s;
    const target = G.units.find(u => u && u.templateId === id) || body;
    const w = get('Weapons').groups(atk, 'melee')[0].weapon;
    const sv = get('_meleeDefenderSaveContext')(atk, target, w, false);
    const defMS = get('meleeDefenderMS')(target, sv.defMSMod, sv.defMSAura);
    out.push(id + ': MS ' + defMS + ', a legionnaire (MS ' + get('Weapons').groups(atk, 'melee')[0].ms + ') needs ' + get('meleeHitThreshold')(get('Weapons').groups(atk, 'melee')[0].ms, defMS) + '+');
    if (typeof get('removeStructure') === 'function') get('removeStructure')(s);
  } catch (e) { out.push(id + ': ' + e.message); }
});
console.info = console.log;
process.stdout.write(out.join('\n') + '\n');
