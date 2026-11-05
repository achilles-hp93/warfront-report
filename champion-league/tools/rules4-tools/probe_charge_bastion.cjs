'use strict';
// Can an enemy Charge the Lamassu Bastion? node probe_charge_bastion.cjs <engine>
const fs = require('fs');
const vm = require('vm');
const sandbox = { console: { log() {}, warn() {}, error() {}, info() {}, debug() {} }, setTimeout, clearTimeout, setInterval, clearInterval, module: { exports: {} }, exports: {} };
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8'), ctx, { filename: 'warfront-engine.js' });
const E = sandbox.module.exports;
const get = n => vm.runInContext(n, ctx);
ctx.G = E.createGameState();
get('setBoardFromMap')({ grid: Array.from({ length: 14 }, () => Array(12).fill('open')), name: 'probe',
  board: { cols: 12, rows: 14, nml: { rowMin: 6, rowMax: 7 }, defaultDeployment: {
    A: { colMin: 0, colMax: 11, rowMin: 8, rowMax: 13 }, B: { colMin: 0, colMax: 11, rowMin: 0, rowMax: 5 } } } });
const G = get('G');
G.phase = 'BATTLE'; G.battlePhase = 'MOVEMENT'; G.round = 2; G.activePlayer = 0;
const place = (id, p, c, r) => { const u = E.createUnit(id, p, false); u.col = c; u.row = r; G.units.push(u); return u; };
const bastion = place('mat_akkadi:lamassu_bastion', 1, 5, 4);
const out = [];
[7, 8, 9].forEach(row => {
  G.units = [bastion];
  const charger = place('iron_imperium:legionnaire_squad', 0, 5, row);
  const can = get('canDeclareCharge')(charger);
  const squares = can.ok ? get('getChargeReachableSquares')(charger) : [];
  const beside = squares.filter(s => Math.max(Math.abs(s.col - 5), Math.abs(s.row - 4)) === 1);
  out.push(`charger ${row - 4} squares away: ${can.ok ? 'may declare' : can.reason}; ${beside.length} Charge square(s) beside the Bastion`);
});
process.stdout.write(out.join('\n') + '\n');
