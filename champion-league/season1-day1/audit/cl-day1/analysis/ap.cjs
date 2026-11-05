'use strict';
// AP and DMG of the ranged and melee profiles carried by the units fielded on Day 1 (by model count).
const fs = require('fs'), path = require('path');
const DATA = '/home/user/warfront/data/editions/fantasy';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.json') && !e.name.startsWith('_') ? [path.join(dir, e.name)] : []));
const W = {}; walk(DATA + '/weapons').forEach(f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); W[j.id] = j; });
const UN = {}; walk(DATA + '/units').forEach(f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); UN[j.faction + ':' + j.id] = j; });
const d = require('./data.json');
const G = { ranged: {}, melee: {} }; const DM = { ranged: {}, melee: {} };
d.units.filter(u => !u.isHQ).forEach(u => {
  const t = UN[u.tid]; if (!t) return;
  (t.composition || []).forEach(c => (c.weapons || []).forEach(wr => {
    const w = W[wr.weapon_id]; if (!w) return;
    const p = (w.profiles || []).find(x => x.id === (wr.profile_id || w.default_profile_id)) || w.profiles[0];
    const s = p.stats || {}; const k = (p.attack_type === 'melee' || !s.RANGE) ? 'melee' : 'ranged';
    const n = c.count || 1;
    G[k]['AP' + (s.AP || 0)] = (G[k]['AP' + (s.AP || 0)] || 0) + n;
    DM[k]['DMG' + (s.DMG || 1)] = (DM[k]['DMG' + (s.DMG || 1)] || 0) + n;
  }));
});
console.log('model-weapons by AP', G); console.log('by DMG', DM);
