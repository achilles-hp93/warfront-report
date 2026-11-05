const fs = require('fs'); const path = require('path');
const { summarize } = require('/home/user/warfront/scripts/battle_report/summarize.cjs');
const dirs = process.argv.slice(2);
const byCard = {};
for (const dir of dirs) {
  let games; try { games = fs.readdirSync(dir).filter(f => /^game-\d+\.json$/.test(f)); } catch (e) { continue; }
  for (const g of games) {
    let r; try { r = JSON.parse(fs.readFileSync(path.join(dir, g))); } catch (e) { continue; }
    let s; try { s = summarize(r); } catch (e) { continue; }
    (s.primary || []).forEach(p => {
      if (!p.card) return;
      const rounds = s.result.round || 5;
      const row = byCard[p.card.id] || (byCard[p.card.id] = { n: 0, vp: 0, zero: 0, rounds: 0 });
      row.n++; row.vp += p.card.vp || 0; row.rounds += rounds; if (!p.card.vp) row.zero++;
    });
  }
}
Object.keys(byCard).sort((a, b) => byCard[b].vp / byCard[b].n - byCard[a].vp / byCard[a].n).forEach(k => {
  const r = byCard[k];
  console.log(k.padEnd(28), 'n', String(r.n).padStart(3), ' avgVP', (r.vp / r.n).toFixed(1).padStart(5), ' perRound', (r.vp / r.rounds).toFixed(2), ' zero', r.zero);
});
