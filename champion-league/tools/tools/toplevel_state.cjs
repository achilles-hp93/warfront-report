// List top-level var/let bindings in engine/modules (non-UI) whose value is
// reassigned or mutated inside function bodies.
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const sub = process.argv[3] || 'engine/modules';
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(p); } })(path.join(root, sub));
const decls = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8').split('\n');
  src.forEach((line, i) => {
    const m = /^(var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(.*)$/.exec(line);
    if (!m) return;
    decls.push({ file: path.relative(root, f), line: i + 1, kind: m[1], name: m[2], init: m[3].slice(0, 50) });
  });
}
const all = files.map(f => [f, fs.readFileSync(f, 'utf8').split('\n')]);
const out = [];
for (const d of decls) {
  const n = d.name.replace(/\$/g, '\\$');
  const re = new RegExp('(^|[^\\w$.])' + n + '\\s*(=[^=]|\\+=|-=|\\+\\+|--|\\[[^\\]]*\\]\\s*=[^=]|\\.(push|set|add|delete|clear|splice|shift|unshift|pop)\\(|\\.[A-Za-z_$][\\w$]*\\s*=[^=])');
  let writes = 0; const where = [];
  for (const [f, lines] of all) {
    lines.forEach((ln, i) => {
      if (/^\s*\/\//.test(ln)) return;
      if (path.relative(root, f) === d.file && i + 1 === d.line) return;
      if (re.test(ln) && /^\s/.test(ln)) { writes++; if (where.length < 3) where.push(path.relative(root, f) + ':' + (i + 1)); }
    });
  }
  if (writes) out.push(`${d.kind} ${d.name} (${d.file}:${d.line}) init=${d.init} writes=${writes} ${where.join(' ')}`);
}
console.log(out.join('\n'));
console.error('decls', decls.length, 'mutated', out.length);
