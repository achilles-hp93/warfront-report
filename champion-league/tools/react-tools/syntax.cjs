// Syntax-check the given JS files: node syntax.cjs <file>...
const vm = require('vm'), fs = require('fs');
let bad = 0;
for (const f of process.argv.slice(2)) {
  try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); } catch (e) { bad++; console.log('BAD', f, e.message); }
}
console.log(bad ? bad + ' bad' : 'all ok');
