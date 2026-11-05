// Size of each top-level segment of a JS bundle: data constants by their
// leading `const|var NAME =` line, modules by their `// MODULE:` separator.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const lines = src.split('\n');
const segs = [];
let cur = { name: '(head)', bytes: 0 };
for (const ln of lines) {
  let m = /^\/\/ (?:SERVER )?MODULE: (.*)$/.exec(ln);
  let d = /^(?:const|var|let) ([A-Z_][A-Z0-9_]*)\s*=/.exec(ln);
  if (m || d) { segs.push(cur); cur = { name: m ? 'module ' + m[1] : 'data ' + d[1], bytes: 0 }; }
  cur.bytes += Buffer.byteLength(ln) + 1;
}
segs.push(cur);
const byKind = {};
for (const s of segs) { const k = s.name.startsWith('module') ? 'modules' : s.name; byKind[k] = (byKind[k] || 0) + s.bytes; }
const top = Object.entries(byKind).sort((a, b) => b[1] - a[1]).slice(0, Number(process.argv[3] || 25));
for (const [k, b] of top) console.log((b / 1e6).toFixed(2).padStart(8), 'MB', k);
console.log('total', (src.length / 1e6).toFixed(2), 'M chars');
