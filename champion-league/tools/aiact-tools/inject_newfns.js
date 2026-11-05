// -----------------------------------------------------------------------------
// ai/movement/forgone_actions.js - what a CHARGE or an ADVANCE takes from the units that
// make it this Battle Round, in the currency the Action Phase prices its actions in
// (_aiScoreAttack, _aiScoreAbility, the rite scores): the one price of both moves' lost
// actions, which the charge score (_aiChargeSquareOptions, ai/movement/evaluators.js) and
// an ADVANCE's worth (aiAdvanceWorth, ai/movement/advance_plan.js) take off.
//
// A joined pair moves as one, and "Advance, Fall Back and Charge count for both units"
// (core rules, Joined units). A pair's CHARGE locks both units' ranged weapons for the
// round (core/movement/charge.js), and after a pair's ADVANCE neither unit may act,
// attack or use an ability unless a rule lets it - an ASSAULT weapon, a rule that lets
// the unit act after it (Legacy of Rakhsh). Priced on the moving unit alone:
//   - Aswaran 1 and the Spahbed pushed in Round 1 on the Aswaran's say - they act after
//     an ADVANCE - and the Spahbed's FREE Firebreath, with Cultist Troopers 1 three
//     squares away, could not fire (Champion League D1-M01 R1);
//   - the Five-Banner Marshal lost his pistol shot at the Dawn King and the Seraph to his
//     White Pole Guard's ADVANCE, twice (D1-M23 R1 and R3);
//   - 84 of the Day's 91 pairs with a CHARACTER advanced in Round 1, and 45 of those
//     CHARACTERs made no shot or cast that round (a caster cannot cast after an ADVANCE).
// The user's ruling (2026-10-30, round 4): an ADVANCE is priced on whether it is
// justified, the shooting it costs against the ground it gains.
// -----------------------------------------------------------------------------

'use strict';

// The HP `unit`'s best ranged attack takes off `enemy` with the weapons the rules let it
// fire this round: after an ADVANCE only those that may fire then
// (weaponCanAttackAfterAdvance: ASSAULT, or every one for a unit a rule lets act).
function _aiShotThisRoundHp(unit, enemy) {
  var groups = _aiGroupsAgainst(unit, enemy, 'ranged');
  var firing = groups.filter(function(group) { return weaponCanAttackAfterAdvance(unit, group.weapon); });
  if (firing.length === groups.length) return aiExpectedRangedDamage(unit, enemy);
  var best = firing.length ? aiBestRangedAttackChoice(unit, enemy, compositionRangedAttackChoices(unit, firing)) : null;
  return best ? best.expected : 0;
}

// The best shot `unit` itself could make this round: its best ranged attack on any enemy
// within its weapons' reach - plus its MOVE while its move is still to come (not moved,
// and not `placed`: read where a move puts it) - and in its army's sight this round
// (_aiEnemiesInSightThisRound, the sight of the before-moving shot rule,
// aiCanShootBeforeMoving), priced as the Action Phase prices it; none when the rules
// leave it no means to attack (attackerMeansBlockReason: no APt and no FREE weapon, no
// weapon that may fire after its ADVANCE). Counted at enemies nobody could see, Covenant
// Levies 6 walked one square in Round 1 for a shot it then had no target for (Champion
// League D1-M15 replayed). Once per decision.
function _aiBestShotThisRound(unit, placed) {
  if (!Weapons.groups(unit, 'ranged').length || attackerMeansBlockReason(unit)) return 0;
  var cache = _aiMoveEvalCache();
  var key = unit.uid + (placed ? '@placed' : '');
  if (cache && Object.prototype.hasOwnProperty.call(cache.chargeForgone, key)) return cache.chargeForgone[key];
  var reach = _aiCachedEffectiveRange(unit) + (placed || unit.moved ? 0 : getEffectiveMove(unit));
  var seen = _aiEnemiesInSightThisRound(unit.player);
  var best = _aiCachedAliveUnits(1 - unit.player).reduce(function(top, e) {
    if (!unitOnBoard(e) || chebyshev(unit.col, unit.row, e.col, e.row) > reach || !seen[e.uid]) return top;
    var hp = _aiShotThisRoundHp(unit, e);
    return hp > 0 ? Math.max(top, _aiScoreAttack(unit, e, hp, 0, null)) : top;
  }, 0);
  if (cache) cache.chargeForgone[key] = best;
  return best;
}

// The most `member`'s action this round is worth with `unit`'s footprint on `sq` - moved
// there (its own square: standing), and, when `advanced`, having ADVANCED there
// (withFootprintAdvanced, movement/default_actions.js), so the rules leave it only what
// they let it do after an ADVANCE: its best shot from there (_aiBestShotThisRound), or
// its best Action Phase action there (aiUnitBestAction, read as its own activation: a
// cast, an ability, a shot), whichever is more. Read on a board changed for it, on a
// scratch cache; once per decision for each square.
function _aiRoundActionAt(unit, member, sq, advanced) {
  var cache = _aiMoveEvalCache();
  var slot = cache && (cache.forgoneActions || (cache.forgoneActions = {}));
  var key = member.uid + '<' + unit.uid + '@' + unit.col + ',' + unit.row + '>' + sq.col + ',' + sq.row + (advanced ? '+advanced' : '');
  if (slot && Object.prototype.hasOwnProperty.call(slot, key)) return slot[key];
  var read = function() {
    // After an ADVANCE that leaves it no action at all - no rule lets it act, and no
    // weapon it holds may fire then (attackerMeansBlockReason asks each) - it has nothing.
    if (advanced && !unitCanActAfterAdvance(member) && attackerMeansBlockReason(member)) return 0;
    return _aiWithScratchMoveEvalCache(function() {
      var best = aiUnitBestAction(member);
      return Math.max(_aiBestShotThisRound(member, true), best ? best.score : 0);
    });
  };
  var moves = sq.col !== unit.col || sq.row !== unit.row;
  var worth = withFootprintAt(unit, sq.col, sq.row, function() {
    return advanced ? withFootprintAdvanced(unit, read) : moves ? withFootprintMoved(unit, read) : read();
  });
  if (slot) slot[key] = worth;
  return worth;
}

/**
 * What a move takes from `unit`'s footprint's actions this Battle Round, summed over
 * every unit of it (footprintMembers), in the Action Phase's currency:
 *   'charge'   each unit's best shot this round (_aiBestShotThisRound): the CHARGE
 *              locks both units' ranged weapons, win or lose;
 *   'advance'  what each unit's action this round is worth had the footprint walked to
 *              `walk` instead (null: stood where it is), less what it is worth after an
 *              ADVANCE aimed at `dest` (_aiRoundActionAt) - an ASSAULT weapon, everything
 *              for a unit a rule lets act after it - on the square each roll of its
 *              Movement Dice takes it to, at that roll's chance (aiAdvanceRollSquares, as
 *              the ADVANCE's ground is priced); never below 0.
 * @param {object} unit
 * @param {string} kind  'charge' or 'advance'
 * @param {object} [dest]  the ADVANCE's square (with its `path`, when it steps along one)
 * @param {object} [walk]  the square the unit walks to instead, or null
 * @returns {number}
 */
function aiForgoneActions(unit, kind, dest, walk) {
  var here = { col: unit.col, row: unit.row };
  return footprintMembers(unit).reduce(function(sum, member) {
    if (kind === 'charge') return sum + _aiBestShotThisRound(member);
    var before = _aiRoundActionAt(unit, member, walk || here, false);
    if (!(before > 0)) return sum;
    var after = aiAdvanceRollSquares(unit, dest).reduce(function(total, roll) {
      return total + roll.chance * _aiRoundActionAt(unit, member, roll.sq, true);
    }, 0);
    return sum + Math.max(0, before - after);
  }, 0);
}

function _markFootprintAdvanced(unit) {
  footprintMembers(unit).forEach(function(member) {
    member.advanced = true;
    member.flags.advanced = true;
  });
}

function withFootprintAdvanced(unit, fn) {
  var has = function(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };
  var put = function(obj, key, had, value) { if (had) obj[key] = value; else delete obj[key]; };
  return withFootprintMoved(unit, function() {
    var saved = footprintMembers(unit).map(function(member) {
      return { unit: member, had: has(member, 'advanced'), advanced: member.advanced,
        hadFlag: has(member.flags, 'advanced'), flag: member.flags.advanced };
    });
    _markFootprintAdvanced(unit);
    try {
      return fn();
    } finally {
      // Left exactly as they were: the checksum reads the unit.
      saved.forEach(function(s) {
        put(s.unit, 'advanced', s.had, s.advanced);
        put(s.unit.flags, 'advanced', s.hadFlag, s.flag);
      });
    }
  });
}

function aiAsOwnActivation(unit, fn) {
  var open = G.unitActivation;
  var active = G.activePlayer;
  var phase = G.battlePhase;
  var failed = AI._failedActions;
  G.battlePhase = 'ACTION';
  G.unitActivation = { uid: unit.uid, phase: G.battlePhase, round: G.round };
  G.activePlayer = unit.player;
  try {
    return rulesReadingAside(fn);
  } finally {
    G.battlePhase = phase;
    G.unitActivation = open;
    G.activePlayer = active;
    AI._failedActions = failed;
  }
}

function aiUnitBestAction(unit) {
  return aiAsOwnActivation(unit, function() {
    return _aiWithScratchMoveEvalCache(function() {
      return _aiCollectActions(unit).reduce(function(best, c) {
        return (!best || c.score > best.score) && _aiCandidateLegal(c, unit.player) ? c : best;
      }, null);
    });
  });
}

function aiAdvanceWorth(unit, dest, walk) {
  return aiAdvanceExpectedScore(unit, dest) - aiW('W_CHARGE_COMBAT') * aiForgoneActions(unit, 'advance', dest, walk);
}

function aiAdvanceRollSquares(unit, dest) {
  var cache = _aiMoveEvalCache();
  var slot = cache && (cache.advanceRolls || (cache.advanceRolls = {}));
  var key = unit.uid + '@' + unit.col + ',' + unit.row + '>' + dest.col + ',' + dest.row + (dest.path ? '+path' : '');
  if (slot && Object.prototype.hasOwnProperty.call(slot, key)) return slot[key];
  var plan = { col: dest.col, row: dest.row, path: dest.path || null };
  var stay = { col: unit.col, row: unit.row };
  var rolls = [];
  advanceRollChances(unit).forEach(function(chance, roll) {
    if (!(chance > 0)) return;
    var squares = aiKeepHeldSquares(unit, reachableSquares(unit, 0, { mode: 'advance', maxMove: getAdvanceMovementPoints(unit, roll) }))
      .filter(function(sq) { return sq.col !== unit.col || sq.row !== unit.row; });
    var sq = squares.length ? aiAdvanceSquareOnPlan(unit, plan, squares) : null;
    rolls.push({ chance: chance, sq: sq || stay });
  });
  if (slot) slot[key] = rolls;
  return rolls;
}

