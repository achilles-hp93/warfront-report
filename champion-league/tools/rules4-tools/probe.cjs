'use strict';
// Rules probe on a built engine bundle: node probe.cjs <warfront-engine.js>
const fs = require('fs');
const vm = require('vm');
const bundle = process.argv[2];
const sandbox = { console, setTimeout, clearTimeout, setInterval, clearInterval, module: { exports: {} }, exports: {} };
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(bundle, 'utf8'), ctx, { filename: 'warfront-engine.js' });
const E = sandbox.module.exports;
const get = n => vm.runInContext(n, ctx);
function board() {
  ctx.G = E.createGameState();
  const mid = 6;
  get('setBoardFromMap')({ grid: Array.from({ length: 12 }, () => Array(12).fill('open')), name: 'probe',
    board: { cols: 12, rows: 12, nml: { rowMin: mid - 1, rowMax: mid }, defaultDeployment: {
      A: { colMin: 0, colMax: 11, rowMin: 7, rowMax: 11 }, B: { colMin: 0, colMax: 11, rowMin: 0, rowMax: 4 } } } });
  const G = get('G');
  G.phase = 'BATTLE'; G.battlePhase = 'ACTION'; G.round = 2; G.activePlayer = 0;
  return G;
}
const place = (id, player, col, row, isHQ) => { const u = E.createUnit(id, player, !!isHQ); u.col = col; u.row = row; get('G').units.push(u); return u; };
const out = {};
const meleeMSThreshold = get('meleeMSThreshold');
const meleeHitThreshold = get('meleeHitThreshold');
out.table = { '4v0': meleeHitThreshold(4, 0), '0v4': meleeHitThreshold(0, 4), '0v0': meleeHitThreshold(0, 0), '4v-2': meleeHitThreshold(4, -2) };

// A unit with no MS on its profile, attacked in melee: the HQ, and a Structure-less no-MS case.
{
  const G = board();
  const atk = place('iron_imperium:legionnaire_squad', 0, 5, 5);
  const hq = place('hq', 1, 5, 4, true);
  const Stats = get('Stats');
  const w = get('Weapons').groups(atk, 'melee')[0].weapon;
  const sv = get('_meleeDefenderSaveContext')(atk, hq, w, false);
  const defMS = get('meleeDefenderMS')(hq, sv.defMSMod, sv.defMSAura);
  out.hq = { hqMS: defMS, attackerMS: get('Weapons').groups(atk, 'melee')[0].ms, needs: meleeHitThreshold(get('Weapons').groups(atk, 'melee')[0].ms, defMS),
    hqCanMelee: get('canMeleeAttack')(hq, atk, null).reason || 'ok' };
  // A debuffed attacker at MS <= 0 (Heartburning Shriek + PARALYZED + FATIGUED is -4).
  const weak = place('iron_imperium:legionnaire_squad', 0, 8, 5);
  const foe = place('iron_imperium:legionnaire_squad', 1, 8, 4);
  get('Models').alive(weak).forEach(m => get('Modifiers').apply(m, { domain: 'model-stat', stat: 'MS', amount: -9, sourceId: 'probe', sourceName: 'Probe', stacking: 'refresh' }));
  const wg = get('Weapons').groups(weak, 'melee')[0];
  const legal = get('canMeleeAttack')(weak, foe, wg.weapon);
  out.debuffed = { effectiveMS: Stats.unit(weak, 'MS').value, groupMS: wg.ms, legal: legal.ok ? 'ok' : legal.reason,
    needs: meleeHitThreshold(wg.ms, Stats.unit(foe, 'MS').value) };
}

// Gatekeeper of Babylon: a friend adjacent to the Bastion saves at +1; not WARD; the AI's readers.
{
  const G = board();
  const bastion = place('mat_akkadi:lamassu_bastion', 0, 5, 5);
  const friend = place('mat_akkadi:temple_levy', 0, 5, 6);
  const far = place('mat_akkadi:temple_levy', 0, 5, 9);
  const foe = place('iron_imperium:legionnaire_squad', 1, 5, 1);
  const save = get('effectiveSaveMod');
  out.gatekeeper = {
    adjacentSave: save(friend, foe, {}), adjacentWard: save(friend, foe, { magicalDamage: true }),
    farSave: save(far, foe, {}), selfSave: save(bastion, foe, {}),
    roles: Object.keys(get('aiUnitRoleTags')(bastion)),
    moveRole: get('_aiMoveRole')(bastion),
    projectionsForFriend: get('auraProjectionsFor')(far).filter(p => p.ownerId === 'gatekeeper_of_babylon').map(p => ({ col: p.col, row: p.row, range: p.range })),
  };
  const sup = get('_aiFriendlySupport');
  get('aiWithMoveEvalCache')(() => {
    out.gatekeeper.friendSupportNextToBastion = sup(far, 5, 6);
    out.gatekeeper.friendSupportAway = sup(far, 5, 9);
    out.gatekeeper.bastionSupportRoleNearFriends = get('_aiSupportRoleBonus')(bastion, 5, 7, 0);
    out.gatekeeper.bastionSupportRoleAlone = get('_aiSupportRoleBonus')(bastion, 11, 0, 0);
  });
}

// A pair's Fall Back; what the CHARACTER can still do at 0 APt.
{
  const G = board();
  G.battlePhase = 'MOVEMENT';
  const legatus = place('iron_imperium:legatus', 0, 5, 5);
  const squad = place('iron_imperium:ironthunder_vanguard', 0, 5, 6);
  const joined = get('attachLeader')(legatus, squad);
  const foe = place('iron_imperium:legionnaire_squad', 1, 5, 7);
  squad.ap = 1; legatus.ap = 1;
  const refuge = get('calcFallBackRange')(squad).filter(sq => Math.max(Math.abs(sq.col - 5), Math.abs(sq.row - 7)) > 1)[0];
  const saved = get('rollDie');
  vm.runInContext('rollDie = function() { return 6; };', ctx);
  let res;
  try { res = get('fallBack')(squad, refuge.col, refuge.row); } finally { ctx.rollDie = saved; vm.runInContext('void 0', ctx); }
  sandbox.__saved = saved; vm.runInContext('rollDie = __saved;', ctx);
  out.pairFallBack = { joined: joined.ok, ok: res && res.ok, squadAp: squad.ap, characterAp: legatus.ap };
}
console.log(JSON.stringify(out, null, 1));

// A CHARACTER with a FREE weapon, after its pair's Fall Back: 0 APt, still fires the FREE weapon.
{
  const G = board();
  G.battlePhase = 'MOVEMENT';
  const knight = place('british_liberation_front:knight_banneret', 0, 5, 5);
  const squad = place(process.argv[3] || 'british_liberation_front:knight_bulwarks', 0, 5, 6);
  const joined = get('attachLeader')(knight, squad);
  const foe = place('iron_imperium:legionnaire_squad', 1, 5, 7);
  const target = place('iron_imperium:legionnaire_squad', 1, 1, 1);
  squad.ap = 1; knight.ap = 1;
  const refuge = get('calcFallBackRange')(squad).filter(sq => Math.max(Math.abs(sq.col - 5), Math.abs(sq.row - 7)) > 1)[0];
  sandbox.__orig = get('rollDie');
  vm.runInContext('rollDie = function() { return 6; };', ctx);
  let res;
  try { res = get('fallBack')(squad, refuge.col, refuge.row); } finally { vm.runInContext('rollDie = __orig;', ctx); }
  G.battlePhase = 'ACTION';
  target.col = knight.col; target.row = Math.max(0, knight.row - 2);
  get('recomputeIntelOnMove')(target);
  const groups = get('Weapons').groups(knight, 'ranged');
  const can = groups.map(g => ({ weapon: g.weapon.name, tags: (g.weapon.tags || []).join(' '),
    check: (get('canAttackWithWeapon')(knight, target, g.weapon) || {}).reason || 'ok' }));
  // Control: the same check with no APt and the FREE weapon already used this round.
  out.freeAfterFallBack = { at: [knight.col, knight.row], target: [target.col, target.row], joined: joined.ok ? 'ok' : joined.reason, fellBack: res && res.ok, knightAp: knight.ap, squadAp: squad.ap, can };
}
console.log(JSON.stringify({ freeAfterFallBack: out.freeAfterFallBack }, null, 1));
