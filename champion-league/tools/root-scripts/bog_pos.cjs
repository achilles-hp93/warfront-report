const fs = require('fs'), path = require('path');
const [root, ...names] = process.argv.slice(2);
for (const name of names) {
  const dir = path.join(root, name, 'games');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f)));
    const objs = g.snaps[0].objectives;
    for (const u of g.snaps[0].units.filter(u => /bogatyr/.test(u.templateId || ''))) {
      let p = { col: u.col, row: u.row }; const line = ['dep(' + p.col + ',' + p.row + ')'];
      g.moves.filter(m => m.uid === u.uid).forEach(m => { p = m.to; const d = Math.min(...objs.map(o => Math.max(Math.abs(o.col - p.col), Math.abs(o.row - p.row)))); line.push('R' + m.round + (m.charged ? 'C' : '') + '(' + p.col + ',' + p.row + ')d' + d); });
      console.log(name.slice(3, 22).padEnd(20), f.padEnd(12), line.join(' '));
    }
  }
}
