'use strict';
// Per-template role readings (the 443 fingerprint's values) on two engine bundles, diffed.
// node roles_diff.cjs <old warfront-engine.js> <new warfront-engine.js>
const fs = require('fs');
const vm = require('vm');
function readings(bundle) {
  const sandbox = { console: { log() {}, warn() {}, error() {}, info() {}, debug() {} }, setTimeout, clearTimeout, setInterval, clearInterval, module: { exports: {} }, exports: {} };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(bundle, 'utf8'), ctx, { filename: 'warfront-engine.js' });
  const E = sandbox.module.exports;
  const get = n => vm.runInContext(n, ctx);
  ctx.G = E.createGameState();
  get('setBoardFromMap')({ grid: Array.from({ length: 12 }, () => Array(12).fill('open')), name: 'probe',
    board: { cols: 12, rows: 12, nml: { rowMin: 5, rowMax: 6 }, defaultDeployment: {
      A: { colMin: 0, colMax: 11, rowMin: 7, rowMax: 11 }, B: { colMin: 0, colMax: 11, rowMin: 0, rowMax: 4 } } } });
  const G = get('G');
  const out = {};
  Object.keys(get('UNITS_DATA')).sort().forEach(id => {
    if (id === 'hq') return;
    G.units = [];
    const unit = E.createUnit(id, 0, false); unit.col = 5; unit.row = 5; G.units.push(unit);
    const values = [get('_aiRoleWeaponValue')(unit, 'melee'), get('_aiRoleWeaponValue')(unit, 'ranged'), get('_aiRoleEffectiveHP')(unit)];
    const tags = get('_aiBuildRoleTags')(unit).tags;
    Object.keys(tags).sort().forEach(t => values.push(t, tags[t]));
    out[id] = JSON.stringify(values);
    G.units = [];
  });
  return out;
}
const a = readings(process.argv[2]);
const b = readings(process.argv[3]);
const ids = new Set(Object.keys(a).concat(Object.keys(b)));
let n = 0;
ids.forEach(id => { if (a[id] !== b[id]) { n++; console.log(id + '\n  old ' + a[id] + '\n  new ' + b[id]); } });
console.log(n + ' template(s) differ of ' + ids.size);
