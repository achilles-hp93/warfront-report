'use strict';
// The AI's price of a charge on a joined pair that would Fall Back (_aiChargeLeavingParts):
// node probe_leaving.cjs <engine>
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
const knight = place('british_liberation_front:knight_banneret', 1, 5, 4);
const squad = place('british_liberation_front:knight_bulwarks', 1, 5, 5);
const joined = get('attachLeader')(knight, squad);
const charger = place('iron_imperium:legionnaire_squad', 0, 5, 9);
const out = { joined: joined.ok };
get('aiWithMoveEvalCache')(() => {
  const parts = get('_aiChargeLeavingParts')(charger, squad, { col: 5, row: 6 });
  out.rest = parts.rest; out.given = parts.given;
  out.squadShot = get('_aiChargeDeniedShot')(charger, squad);
  out.characterShot = get('_aiChargeDeniedShot')(charger, knight);
});
process.stdout.write(JSON.stringify(out) + '\n');
