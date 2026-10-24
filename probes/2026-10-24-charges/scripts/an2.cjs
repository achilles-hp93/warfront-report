// Declined charges: rounds where a stronger melee unit turned a charge down while a weaker friend charged.
const fs = require('fs');
const f2 = v => v == null ? '-' : (Math.round(v * 100) / 100).toFixed(2);
let pairs = 0, declinedHeld = 0, declined = 0, taken = 0;
process.argv.slice(2).forEach(file => {
  const d = JSON.parse(fs.readFileSync(file));
  const offers = Object.values(d.probe.offers || {});
  offers.forEach(o => { if (o.outcome === 'charge') taken++; else { declined++; if (o.held) declinedHeld++; } });
  const byRound = {};
  offers.forEach(o => { (byRound[o.round + ':' + o.player] = byRound[o.round + ':' + o.player] || []).push(o); });
  console.log('==', file);
  Object.entries(byRound).forEach(([k, list]) => {
    const chargers = list.filter(o => o.outcome === 'charge');
    const holders = list.filter(o => o.outcome !== 'charge');
    holders.forEach(h => chargers.forEach(c => {
      if (!(h.maxMelee > 1.5 * c.maxMelee)) return;
      pairs++;
      const b = h.best;
      console.log(`R${h.round} HELD ${h.name} (${h.outcome}${h.held ? ', holds obj' : ''}, melee ${f2(h.maxMelee)}): best charge -> ${b.target} P${f2(b.P)} dealt ${f2(b.dealt)} taken ${f2(b.taken)} score ${f2(b.score)} vs floor ${f2(h.floor)} (dest ${f2(b.dest)} stay ${f2(b.stay)} walk ${f2(h.walkDest)})`);
      console.log(`      while ${c.name} (melee ${f2(c.maxMelee)}) charged ${c.best.target} dealt ${f2(c.best.dealt)} taken ${f2(c.best.taken)} (score ${f2(c.best.score)} floor ${f2(c.floor)})`);
    }));
  });
});
console.log({ taken, declined, declinedHeld, heavyHeldWhileWeakerCharged: pairs });
