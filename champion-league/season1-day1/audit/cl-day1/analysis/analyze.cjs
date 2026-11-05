'use strict';
// Tables for the Day 1 balance analysis, from data.json (collect.cjs). Prints markdown.
const path = require('path');
const d = require(process.argv[2] || path.join(__dirname, 'data.json'));
const out = [];
const P = (...a) => out.push(a.join(' '));
const f1 = x => (x == null || !isFinite(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1));
const f2 = x => (x == null || !isFinite(x) ? '-' : x.toFixed(2));
const pct = x => (x == null || !isFinite(x) ? '-' : Math.round(x * 100) + '%');
const sum = (a, k) => a.reduce((t, x) => t + (typeof k === 'function' ? k(x) : x[k]), 0);
const mean = a => (a.length ? a.reduce((t, x) => t + x, 0) / a.length : null);
const sd = a => { const m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce((t, x) => t + (x - m) ** 2, 0) / (a.length - 1)) : null; };
function corr(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let n = 0, a = 0, b = 0;
  xs.forEach((x, i) => { n += (x - mx) * (ys[i] - my); a += (x - mx) ** 2; b += (ys[i] - my) ** 2; });
  return n / Math.sqrt(a * b);
}
function table(head, rows) {
  P('| ' + head.join(' | ') + ' |');
  P('|' + head.map(() => '---').join('|') + '|');
  rows.forEach(r => P('| ' + r.join(' | ') + ' |'));
  P('');
}
const dmgOf = u => Object.values(u.dmgByKind).reduce((t, x) => t + x, 0);
const KINDS = ['ranged', 'overwatch', 'melee', 'magic', 'ability', 'effect'];
const units = d.units.filter(u => !u.isHQ);
const hq = d.units.filter(u => u.isHQ);
const sideOf = u => d.battles.find(b => b.id === u.battle).sides[u.player];
const battleOf = u => d.battles.find(b => b.id === u.battle);
const won = u => battleOf(u).winner === u.player;

// Role from the template's weapons: attacks x DMG per model, ranged vs melee.
function role(u) {
  const tags = u.tags || [];
  if (u.character) return 'CHARACTER';
  if (tags.includes('VEHICLE') || tags.includes('MACHINE') || tags.includes('ARTILLERY')) return (u.rangedW > u.meleeW ? 'vehicle/gun (ranged)' : 'vehicle/beast (melee)');
  if (tags.includes('MONSTER')) return (u.rangedW > u.meleeW ? 'vehicle/gun (ranged)' : 'vehicle/beast (melee)');
  return u.rangedW > u.meleeW ? 'shooter squad' : 'melee squad';
}
function tier(u) {
  const t = u.tags || [];
  for (const k of ['EPIC HERO', 'EPIC', 'ELITE', 'SPECIALIST', 'STANDARD']) if (t.includes(k)) return k === 'EPIC HERO' ? 'EPIC' : k;
  return 'other';
}

// ---- Global
const totalVp = sum(d.battles, b => b.vp[0] + b.vp[1]);
const src = { objectives: 0, primary: 0, missions: 0, other: 0 };
d.battles.forEach(b => b.sides.forEach(s => Object.keys(src).forEach(k => { src[k] += s.vpSrc[k]; })));
const unitVp = sum(units, 'vp'), hqVp = sum(hq, 'vp');
const unassigned = sum(d.battles, b => sum(b.sides, s => s.unassigned.objectives + s.unassigned.primary + s.unassigned.missions));
const totalRp = sum(units, 'rp');
const RATE = unitVp / totalRp * 100;
P('## Global');
P(`battles ${d.battles.length}, sides ${d.battles.length * 2}, non-HQ unit copies ${units.length} (arrived mid-battle ${units.filter(u => u.arrived).length}), RP ${totalRp}`);
P(`VP total ${totalVp}: objectives ${src.objectives} (${pct(src.objectives / totalVp)}), primary ${src.primary} (${pct(src.primary / totalVp)}), missions ${src.missions} (${pct(src.missions / totalVp)}), other ${src.other}`);
P(`VP to units ${f1(unitVp)}, to HQ ${f1(hqVp)}, unassigned ${f1(unassigned)}; units' VP per 100 RP = ${f2(RATE)}`);
P(`winner VP ${f1(mean(d.battles.map(b => b.vp[b.winner])))}, loser VP ${f1(mean(d.battles.map(b => b.vp[1 - b.winner])))}; rounds ${JSON.stringify(d.battles.reduce((t, b) => { t[b.round] = (t[b.round] || 0) + 1; return t; }, {}))}`);
P(`Player A wins ${d.battles.filter(b => b.winner === 0).length}/24; side with initiative wins ${d.battles.filter(b => b.winner === b.initiative).length}/24`);
P('');

// ---- Per template
const T = {};
units.forEach(u => {
  const k = u.tid;
  const t = T[k] = T[k] || { tid: k, type: u.type, faction: u.faction, list: [] };
  t.list.push(u);
});
const trows = Object.values(T).map(t => {
  const L = t.list, n = L.length, u0 = L[0];
  const rp = sum(L, 'rp');
  const vps = L.map(u => u.vp);
  const within = L.map(u => {
    const side = d.units.filter(x => x.battle === u.battle && x.player === u.player && !x.isHQ);
    const sv = sum(side, 'vp'), sr = sum(side, 'rp');
    return sv > 0 ? (u.vp / sv) / (u.rp / sr) : 0;
  });
  return {
    t, n, type: t.type, faction: t.faction, baseRp: u0.baseRp, rpAvg: rp / n, oc: u0.oc, models: u0.models, hp: u0.hp, def: u0.def, role: role(u0), tier: tier(u0),
    ocPer100: u0.baseRp ? u0.oc * 100 / u0.baseRp : null,
    vp: sum(L, 'vp') / n, vpSd: sd(vps), vpObj: sum(L, 'vpObj') / n, vpPrim: sum(L, 'vpPrim') / n, vpMis: sum(L, 'vpMis') / n, pivotal: sum(L, 'pivotal') / n,
    per100: sum(L, 'vp') * 100 / rp, excess: (sum(L, 'vp') - RATE * rp / 100) / n,
    dealt: sum(L, dmgOf) / n, dealtPer100: sum(L, dmgOf) * 100 / rp, taken: sum(L, 'taken') / n, takenPerHp: sum(L, 'taken') / sum(L, u => u.hp || 1),
    surv: L.filter(u => u.alive).length / n, idle: sum(L, 'idle') / n, onObj: sum(L, 'onObjRounds') / n, ocRounds: sum(L, 'ocRounds') / n,
    rounds: sum(L, 'rounds') / n, within: mean(within), wins: L.filter(won).length, battles: [...new Set(L.map(u => u.battle))].join(','),
    kills: sum(L, 'killsN') / n,
  };
});
const TH = ['unit', 'faction', 'n', 'RP', 'OC', 'mdl', 'VP/copy', 'VP/100RP', 'excess VP/copy', 'objVP', 'hinged', 'dmg/copy', 'dmg/100RP', 'taken', 'surv', 'idle', 'onObj rds', 'in-army idx', 'W', 'battles'];
const trow = r => [r.type, r.faction.split('_').slice(0, 2).join('_'), r.n, f1(r.rpAvg), r.oc, r.models, f1(r.vp), f1(r.per100), f1(r.excess), f1(r.vpObj), f1(r.pivotal), f1(r.dealt), f1(r.dealtPer100), f1(r.taken), pct(r.surv), f1(r.idle), f1(r.onObj), f2(r.within), r.wins + '/' + r.n, r.battles];
P('## All unit types, by excess VP per copy (VP minus ' + f2(RATE) + ' per 100 RP)');
table(TH, trows.slice().sort((a, b) => b.excess - a.excess).map(trow));

// ---- Role
P('## By role (template weapons)');
const R = {};
units.forEach(u => { const k = role(u); (R[k] = R[k] || []).push(u); });
table(['role', 'copies', 'RP', 'RP share', 'VP', 'VP share', 'VP/100RP', 'objVP/100RP', 'dmg dealt', 'dmg share', 'dmg/100RP', 'taken/100RP', 'surv', 'idle/copy', 'onObj rds/copy', 'OC/100RP'],
  Object.entries(R).map(([k, L]) => {
    const rp = sum(L, 'rp');
    return [k, L.length, rp, pct(rp / totalRp), f1(sum(L, 'vp')), pct(sum(L, 'vp') / unitVp), f2(sum(L, 'vp') * 100 / rp), f2(sum(L, 'vpObj') * 100 / rp), sum(L, dmgOf), pct(sum(L, dmgOf) / sum(units, dmgOf)),
      f1(sum(L, dmgOf) * 100 / rp), f1(sum(L, 'taken') * 100 / rp), pct(L.filter(u => u.alive).length / L.length), f2(sum(L, 'idle') / L.length), f2(sum(L, 'onObjRounds') / L.length), f1(sum(L, 'oc') * 100 / rp)];
  }));
P('## By tier tag');
const TI = {};
units.forEach(u => { const k = tier(u) + (u.character ? ' (CHARACTER)' : ''); (TI[k] = TI[k] || []).push(u); });
table(['tier', 'copies', 'RP', 'VP/100RP', 'objVP/100RP', 'hinged/100RP', 'dmg/100RP', 'OC/100RP', 'models/100RP', 'surv', 'idle/copy'],
  Object.entries(TI).map(([k, L]) => {
    const rp = sum(L, 'rp');
    return [k, L.length, rp, f2(sum(L, 'vp') * 100 / rp), f2(sum(L, 'vpObj') * 100 / rp), f2(sum(L, 'pivotal') * 100 / rp), f1(sum(L, dmgOf) * 100 / rp), f1(sum(L, 'oc') * 100 / rp), f1(sum(L, 'models') * 100 / rp), pct(L.filter(u => u.alive).length / L.length), f2(sum(L, 'idle') / L.length)];
  }));

// ---- Attack kinds
P('## Damage and kills by attack kind (effective HP lost; kills = units destroyed by that blow)');
const K = {}; const KK = {};
d.battles.forEach(b => b.sides.forEach(s => { Object.entries(s.dmg).forEach(([k, v]) => { K[k] = (K[k] || 0) + v; }); Object.entries(s.kills).forEach(([k, v]) => { KK[k] = (KK[k] || 0) + v; }); }));
const totK = Object.values(K).reduce((a, b) => a + b, 0), totKK = Object.values(KK).reduce((a, b) => a + b, 0);
const attacks = {};
units.concat(hq).forEach(u => Object.entries(u.attacksByKind || {}).forEach(([k, v]) => { attacks[k] = (attacks[k] || 0) + v; }));
table(['kind', 'damage', 'share', 'kills', 'share', 'attack records', 'dmg per record'], KINDS.map(k => [k, K[k] || 0, pct((K[k] || 0) / totK), KK[k] || 0, pct((KK[k] || 0) / totKK), attacks[k] || 0, f2((K[k] || 0) / (attacks[k] || 1))]));
P(`total damage ${totK}, kills ${totKK}`);
// Damage by role and kind
P('');
P('### Damage by role x kind');
table(['role'].concat(KINDS), Object.entries(R).map(([k, L]) => [k].concat(KINDS.map(kind => sum(L, u => u.dmgByKind[kind] || 0)))));

// ---- OC and bodies at side level
P('## Side level: OC, bodies, and VP');
const S = [];
d.battles.forEach(b => b.sides.forEach((s, p) => {
  const us = units.filter(u => u.battle === b.id && u.player === p);
  const dep = us.filter(u => !u.arrived);
  S.push({ b, p, s, win: b.winner === p ? 1 : 0, vp: b.vp[p], obj: s.vpSrc.objectives, oc: sum(dep, 'oc'), models: sum(dep, 'models'), unitsN: dep.length, squads: dep.filter(u => !u.character).length,
    ocRounds: sum(us, 'ocRounds'), onObj: sum(us, 'onObjRounds'), lostRp: s.lostRp, dmg: Object.values(s.dmg).reduce((a, x) => a + x, 0), rounds: b.round,
    ocPerRound: sum(us, 'ocRounds') / b.round });
}));
const keys = ['oc', 'models', 'unitsN', 'squads', 'ocPerRound', 'onObj', 'dmg', 'lostRp'];
table(['measure', 'r with objective VP', 'r with total VP', 'r with win', 'mean (winners)', 'mean (losers)'], keys.map(k => [k, f2(corr(S.map(x => x[k]), S.map(x => x.obj))), f2(corr(S.map(x => x[k]), S.map(x => x.vp))), f2(corr(S.map(x => x[k]), S.map(x => x.win))),
  f1(mean(S.filter(x => x.win).map(x => x[k]))), f1(mean(S.filter(x => !x.win).map(x => x[k])))]));
// Head-to-head: the side with more X won?
const h2h = k => { let w = 0, l = 0, t = 0; d.battles.forEach(b => { const a = S.find(x => x.b === b && x.p === 0), c = S.find(x => x.b === b && x.p === 1); if (a[k] === c[k]) { t++; return; } const more = a[k] > c[k] ? 0 : 1; if (b.winner === more) w++; else l++; }); return `${w}-${l}${t ? ' (' + t + ' tied)' : ''}`; };
P('Side with more of X won (W-L): ' + keys.map(k => `${k} ${h2h(k)}`).join('; '));
P('');

// ---- OC at unit level
P('## Unit level: OC per 100 RP vs VP per 100 RP');
const buckets = [[0, 10], [10, 20], [20, 35], [35, 1000]];
table(['OC/100RP', 'copies', 'RP', 'VP/100RP', 'objVP/100RP', 'hinged/100RP', 'dmg/100RP', 'surv', 'onObj rds/copy'], buckets.map(([lo, hi]) => {
  const L = units.filter(u => { const r = u.oc * 100 / (u.baseRp || u.rp || 1); return r >= lo && r < hi; });
  const rp = sum(L, 'rp');
  return [`${lo}-${hi === 1000 ? '+' : hi}`, L.length, rp, f2(sum(L, 'vp') * 100 / rp), f2(sum(L, 'vpObj') * 100 / rp), f2(sum(L, 'pivotal') * 100 / rp), f1(sum(L, dmgOf) * 100 / rp), pct(L.filter(u => u.alive).length / L.length), f2(sum(L, 'onObjRounds') / L.length)];
}));
const ux = units.filter(u => u.rp > 0);
P(`unit-copy correlations: r(OC/RP, VP/RP) ${f2(corr(ux.map(u => u.oc / u.rp), ux.map(u => u.vp / u.rp)))}; r(OC/RP, objVP/RP) ${f2(corr(ux.map(u => u.oc / u.rp), ux.map(u => u.vpObj / u.rp)))}; r(dmg/RP, VP/RP) ${f2(corr(ux.map(u => dmgOf(u) / u.rp), ux.map(u => u.vp / u.rp)))}; r(models/RP, VP/RP) ${f2(corr(ux.map(u => u.models / u.rp), ux.map(u => u.vp / u.rp)))}`);
P(`r(onObj rounds, VP) ${f2(corr(ux.map(u => u.onObjRounds), ux.map(u => u.vp)))}; r(ocRounds, objVP) ${f2(corr(ux.map(u => u.ocRounds), ux.map(u => u.vpObj)))}; r(dmg, VP) ${f2(corr(ux.map(dmgOf), ux.map(u => u.vp)))}; r(survived, VP) ${f2(corr(ux.map(u => (u.alive ? 1 : 0)), ux.map(u => u.vp)))}`);
P('');

// ---- Army level
P('## Faction and preset');
const F = {};
S.forEach(x => { const k = x.s.factionName || x.s.faction; (F[k] = F[k] || []).push(x); });
table(['faction', 'sides', 'W-L', 'VP for', 'VP against', 'obj VP', 'presets'], Object.entries(F).sort((a, b) => sum(b[1], 'win') / b[1].length - sum(a[1], 'win') / a[1].length || sum(b[1], 'vp') - sum(a[1], 'vp')).map(([k, L]) => [k, L.length, `${sum(L, 'win')}-${L.length - sum(L, 'win')}`, sum(L, 'vp'), sum(L, x => x.b.vp[1 - x.p]), sum(L, 'obj'), L.map(x => x.s.name).join(', ')]));
P('### Presets');
table(['army', 'faction', 'battle', 'W', 'VP', 'opp VP', 'obj/prim/mis', 'units (squads+chars)', 'models', 'OC', 'dmg dealt', 'RP lost', 'mana +/-/held', 'casters'], S.slice().sort((a, b) => (b.vp - b.b.vp[1 - b.p]) - (a.vp - a.b.vp[1 - a.p])).map(x => {
  const us = units.filter(u => u.battle === x.b.id && u.player === x.p);
  const casters = us.filter(u => (u.tags || []).includes('MAGIC_CASTER')).map(u => u.type);
  const mana = x.s.pools.mana || { gained: 0, spent: 0, held: 0 };
  return [x.s.name, (x.s.factionName || '').slice(0, 24), x.b.id, x.win ? 'W' : 'L', x.vp, x.b.vp[1 - x.p], `${x.s.vpSrc.objectives}/${x.s.vpSrc.primary}/${x.s.vpSrc.missions}`, `${x.squads}+${x.unitsN - x.squads}`, x.models, x.oc, x.dmg, x.lostRp, `${mana.gained}/${mana.spent}/${mana.held}`, casters.join('; ') || 'none'];
}));
console.log(out.join('\n'));
module.exports = { trows };
