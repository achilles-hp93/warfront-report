// Which FACTIONS_DATA / SFX_VISUALS fields are large (data URLs?).
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(process.argv[2], 'utf8');
const names = (process.argv[3] || 'FACTIONS_DATA,SFX_VISUALS').split(',');
for (const name of names) {
  const start = src.search(new RegExp('^(?:const|var|let) ' + name + '\\s*=', 'm'));
  const rest = src.slice(start);
  // up to the next top-level declaration
  const next = rest.slice(10).search(/^(?:const|var|let|function) [A-Za-z_$]/m);
  const chunk = rest.slice(0, next + 10).replace(/^(const|let) /, 'var ');
  const ctx = {};
  vm.createContext(ctx);
  try { vm.runInContext(chunk, ctx); } catch (e) { console.log(name, 'eval failed', e.message); continue; }
  const val = ctx[name];
  const big = [];
  (function walk(v, p) {
    if (typeof v === 'string') { if (v.length > 20000) big.push([p, v.length, v.slice(0, 40)]); return; }
    if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p + '.' + k);
  })(val, name);
  const byKey = {};
  for (const [p, n] of big) { const k = p.replace(/\.[^.]*?(\.|$)/, '.*$1').replace(/\d+/g, '#'); byKey[k] = (byKey[k] || 0) + n; }
  console.log(name, 'big strings', big.length, Object.entries(byKey).sort((a, b) => b[1] - a[1]).slice(0, 10));
  console.log(big.slice(0, 3));
}
