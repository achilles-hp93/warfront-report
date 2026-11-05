// -------------------------------------------------------------------------
// ai_command.js  -  Command Phase AI (missions, HQ commands)
// -------------------------------------------------------------------------

'use strict';

function aiGetHQPassChance(cp) {
  if (cp == null || cp <= 5) return 0.20;
  if (cp >= 14) return 0;
  return Math.max(0, 0.20 * (14 - cp) / 9);
}

function _aiPickWeightedHQCandidate(candidates) {
  if (!candidates || candidates.length === 0) return null;
  var total = 0;
  for (var i = 0; i < candidates.length; i++) {
    total += Math.max(0, candidates[i].weight || 0);
  }
  if (total <= 0) return null;
  var roll = aiRandom() * total;
  var acc = 0;
  for (var j = 0; j < candidates.length; j++) {
    acc += Math.max(0, candidates[j].weight || 0);
    if (roll <= acc) return candidates[j];
  }
  return candidates[candidates.length - 1];
}

function _aiGetHQUnit(player) {
  return G.units.find(function(u) {
    return u.isHQ && u.player === player && u.alive;
  }) || null;
}

function _aiGetHQCommandIdx(name) {
  var commands = getAvailableHQCommands(AI.player);
  for (var i = 0; i < commands.length; i++) {
    if (commands[i].name === name) return i;
  }
  return -1;
}

function _aiCommandFriendlies(player) {
  return G.units.filter(function(u) {
    return u.alive && u.col >= 0 && u.player === player;
  });
}

function _aiCommandEnemies(player) {
  return G.units.filter(function(u) {
    return u.alive && u.col >= 0 && u.player !== player;
  });
}

function _aiCommandCanTargetEnemy(unit, enemy) {
  if (!unit || !enemy || !unit.alive || !enemy.alive) return false;
  var profiles = aiGetUsableAttackProfiles(unit);
  for (var i = 0; i < profiles.length; i++) {
    var weapon = profiles[i];
    var check = weapon ? canAttackWithWeapon(unit, enemy, weapon) : canAttack(unit, enemy);
    if (check.ok) return true;
  }
  return false;
}

function _aiCommandCountAttackTargets(unit, enemies) {
  if (!unit || !unit.alive || unit.col < 0) return 0;
  var count = 0;
  var enemyUnits = enemies || _aiCommandEnemies(unit.player);
  for (var i = 0; i < enemyUnits.length; i++) {
    if (_aiCommandCanTargetEnemy(unit, enemyUnits[i])) count++;
  }
  return count;
}

// The enemies `perBonus` more PER on `unit` would let its side see that nothing
// of its side sees now, and that one of its units could shoot this Battle Round.
// The bonus is given in the Command Phase and used after both sides have moved, so
// it is asked from the square the unit stands on and from the one the AI's move
// choice would take it to (aiChooseDestination): an enemy counts when, from one of
// them, only the bonus brings it into sight - and no other unit of its side could see
// it from where its own walk reaches (its PER plus its MOVE): spotting is the army's,
// and an enemy the side's next move sees anyway is no spot the bonus bought. A
// shooter counts if a ranged weapon reaches the enemy after a move (its range plus
// its MOVE). Asked from the unit's best local square, with every other unit's walk
// left out, 14 of the Protectores' 20 Scouting Orders spotted nothing (Palatine vs
// Convent, 2026-10-27).
function _aiCommandNewSpotCount(unit, perBonus, enemies) {
  if (!unit || !unit.alive || unit.col < 0) return 0;
  var others = _aiCommandFriendlies(unit.player).filter(function(f) {
    return f.col >= 0 && !isStructure(f) && footprintMembers(unit).indexOf(f) < 0;
  });
  var unseen = (enemies || _aiCommandEnemies(unit.player)).filter(function(enemy) {
    return enemy.alive && enemy.col >= 0 && !(enemy.statuses && enemy.statuses.includes(STATUS_HIDDEN))
      && !isSpotted(unit.player, enemy.col, enemy.row, enemy)
      && !others.some(function(f) { return chebyshev(f.col, f.row, enemy.col, enemy.row) <= getEffectivePER(f) + getMovementPoints(f); });
  });
  if (!unseen.length) return 0;
  var per = getEffectivePER(unit);
  var squares = [{ col: unit.col, row: unit.row }];
  var likely = aiChooseDestination(unit, reachableSquares(unit, 0), { greedy: true });
  if (likely && (likely.col !== unit.col || likely.row !== unit.row)) squares.push({ col: likely.col, row: likely.row });
  var shooters = _aiCommandFriendlies(unit.player).filter(function(f) { return Weapons.groups(f, 'ranged').length > 0; });
  return unseen.filter(function(enemy) {
    var onlyWithBonus = squares.some(function(sq) {
      return seesSquareFrom(sq, per + (perBonus || 0), enemy.col, enemy.row, enemy)
        && !seesSquareFrom(sq, per, enemy.col, enemy.row, enemy);
    });
    return onlyWithBonus && shooters.some(function(f) {
      var reach = Weapons.groups(f, 'ranged').reduce(function(most, g) {
        return Math.max(most, getEffectiveWeaponRange(f, g.weapon));
      }, 0);
      return chebyshev(f.col, f.row, enemy.col, enemy.row) <= reach + getMovementPoints(f);
    });
  }).length;
}

function _aiCommandThreatLevel(unit) {
  if (!unit) return 0;
  return _aiThreatExposure(unit, unit.col, unit.row) || 0;
}

// The Objective Areas around `unit` whose control `deltaOC` more OC for its side
// (less, when negative) would change: { gained: the objectives it would win for its
// side, lost: those its side would no longer control }. A HOVER unit weighs landing and
// lifting off by both (ai/hover_altitude.js); a CHARGE the objectives its target gives
// up. (Secure Objective counts the enemy's arrivals too: ai/command/objective_hold_value.js.)
function aiObjectiveControlChange(unit, deltaOC) {
  var change = { gained: [], lost: [] };
  if (!unit || !G.objectives || !deltaOC) return change;
  for (var i = 0; i < G.objectives.length; i++) {
    var obj = G.objectives[i];
    if (chebyshev(unit.col, unit.row, obj.col, obj.row) > 1) continue;
    var summary = objectiveControlSummary(obj);
    var before = objectiveControllerFromSummary(obj, summary);
    var after = {
      p0: { oc: summary.p0.oc, units: summary.p0.units },
      p1: { oc: summary.p1.oc, units: summary.p1.units },
    };
    if (unit.player === 0) after.p0.oc += deltaOC;
    else after.p1.oc += deltaOC;
    var afterWinner = objectiveControllerFromSummary(obj, after);
    if (before !== unit.player && afterWinner === unit.player) change.gained.push(obj);
    if (before === unit.player && afterWinner !== unit.player) change.lost.push(obj);
  }
  return change;
}

// The square of `squares` the destination score (aiScoreDestination) rates
// best for `unit` - on the board or off it: a unit off the board (a requisition
// probe while its HQ is in Transitional State) is scored by the same terms;
// those that ask where the unit stands now find it on no square.
function _aiCommandBestSquare(unit, squares) {
  if (!squares || squares.length === 0) return null;
  var best = null;
  for (var i = 0; i < squares.length; i++) {
    var sq = squares[i];
    var score = aiScoreDestination(unit, sq);
    if (!best || score > best.score) {
      best = { col: sq.col, row: sq.row, score: score };
    }
  }
  return best;
}

// Where the immediate move `effect` grants `unit` takes it: the square the unit's
// own choice (aiChooseDestination, carrying on the far square it set out for) takes
// among the squares that move will offer (immediateMoveSquares,
// abilities/ops/grant_move.js), and what that square gains on the destination score
// over standing. A step toward its far square that scores worse here gains nothing:
// the unit walks there in its own Movement Phase. Where
// the unit would rather stay, the move gains nothing and still names the best square,
// for a command bought for its other effects (its move applier needs one). A
// grant_move that moves the unit later is valued by the move it would make now.
function _aiCommandRepositionPlan(unit, effect) {
  if (!unit || !effect) return null;
  var squares = immediateMoveSquares(unit, effect);
  var pick = aiChooseDestination(unit, squares, { greedy: true, granted: true });
  var stay = aiScoreDestination(unit, { col: unit.col, row: unit.row });
  if (!pick) {
    var best = _aiCommandBestSquare(unit, squares);
    return best && { dest: { col: best.col, row: best.row }, improvement: 0, score: best.score };
  }
  var score = aiScoreDestination(unit, pick);
  return { dest: { col: pick.col, row: pick.row }, improvement: score - stay, score: score };
}

// A stand-in unit for scoring a placement square, built from the template's real
// composition. It deliberately does NOT go through createUnit: nextUnitId is
// registered battle state, so minting a throwaway unit would advance the replay
// and multiplayer counter during a scoring pass. Models.createRoster does the
// same aggregation the factory relies on, and resolves nothing else.
//
// Fantasy unit templates carry `stats: null` at the top level - every stat lives
// on the composition models - so this used to read an absent stat block behind
// `||` defaults and score every candidate as HP 1 / DEF 6 / MOVE 0 / PER 0.
function _aiCommandRequisitionProbeUnit(player, tpl, hq) {
  if (!tpl || !Array.isArray(tpl.composition) || tpl.composition.length === 0) {
    throw new Error('requisition probe: ' + ((tpl && tpl.id) || 'template') + ' declares no composition');
  }
  // Its own uid per unit type: the scoring pass caches by uid (aiWithMoveEvalCache).
  var probe = {
    uid: 'requisition:' + tpl.id,
    id: tpl.id,
    templateId: tpl.id,
    name: tpl.name || tpl.id,
    player: player,
    alive: true,
    col: hq ? hq.col : 0,
    row: hq ? hq.row : 0,
    tags: (tpl.tags || []).slice(),
    statuses: [],
    flags: {},
    mods: {},
    gear: null,
    weapons: [],
    abilities: tpl.abilities || [],
    preferredTerrain: tpl.preferredTerrain || [],
    rp: tpl.rp,
  };
  Models.createRoster(probe, resolveTemplateComposition(tpl.composition));
  return probe;
}

// Does any weapon the template's models carry open armour: AP 2 or more, or DMG
// 3 or more? Asked of the requisition probe (_aiCommandRequisitionProbeUnit: the
// template's real roster), each weapon as the rules resolve it for its model
// (Weapons.profile) - its stats with every rule it carries applied. The raw
// template read this replaced looked its weapons up under a bare id the weapon
// table does not use, so it never found one and no template ever opened armour.
function _aiTemplateOpensArmour(probe) {
  return Models.all(probe).some(function(model) {
    return (model.weapons || []).some(function(weapon) {
      var profile = Weapons.profile(probe, model, weapon, { preview: true });
      return profile.ap >= 2 || profile.dmg >= 3;
    });
  });
}

// Of the unit types Troop Requisition offers (troopRequisitionTemplates: the
// command's own rule), does the AI want to weigh `tpl`? No BASE, which the AI has
// always left alone although the command would place one. Whether its CP covers
// the price is previewHQCommand's question (_aiCommandCheapestIssue).
function _aiCommandRequisitionWanted(tpl) {
  return tpl.tags.indexOf('BASE') < 0;
}

// `probe` carries the template's real composition-derived stats. This used to
// read tpl.stats, which is null on every Fantasy template, so OC scored 0 and HP
// scored a flat 1 for every candidate - the weight could not tell a body that
// holds an objective from one that does not.
// `price` is the CP the command will be issued at for this unit type
// (previewHQCommand, through _aiCommandCheapestIssue), not the printed price.
//
// The weighing: what the unit brings (a flat 0.4, its OC and HP, INFANTRY, a
// thin line, an objective nobody holds, an answer to armour) divided by what
// its CP would otherwise buy. Troop Requisition costs 3, 5 or 7 CP by the
// unit's RP; the other HQ commands cost 1-3 CP, and CP comes in a point or two
// a Battle Round. So 3 CP is about one other command, and 7 CP is two or three
// of them, saved up over rounds: the divisor grows with the square of the
// price, price x price x 0.15 - 1.35 at 3 CP (what a 3 CP unit was always
// divided by), 3.75 at 5 CP, 7.35 at 7 CP. A 7 CP unit has to bring over five
// times what a 3 CP unit does to be drawn as often. The price enters only
// here; the bonus a cheap unit used to add on top (0.25 a CP under 6) is gone,
// so no unit type weighs more than it did under the old 3/4/6 CP tier prices.
function _aiLegacyCommandRequisitionTemplateWeight(player, tpl, probe, friendlies, enemies, price) {
  var tags = tpl.tags || [];
  var unitOC = Stats.unit(probe, 'OC').value;
  var unitHP = Stats.health(probe).current;

  var weight = 0.4;
  weight += unitOC * 0.65;
  weight += unitHP * 0.15;
  if (tags.indexOf('INFANTRY') >= 0) weight += 1.4;
  if (friendlies.length <= 4) weight += 1.5;
  else if (friendlies.length <= 6) weight += 0.8;

  var needsObjectiveBody = false;
  if (G.objectives && G.objectives.length) {
    needsObjectiveBody = G.objectives.some(function(obj) {
      return !friendlies.some(function(u) {
        return !u.tags.includes('FLYING') && getEffectiveOC(u) > 0 &&
          inObjectiveAreaOf(obj, u.col, u.row);
      });
    });
  }
  if (needsObjectiveBody && tags.indexOf('INFANTRY') >= 0) weight += 2.0 + unitOC * 0.5;

  var enemyArmor = enemies.some(function(e) {
    return e.tags && (e.tags.includes('TOUGH') || e.tags.includes('VEHICLE'));
  });
  // Whether a template answers armour is a question about its guns, not about a label:
  // a profile that carries AP 2 or DMG 3 is what opens a 2+ save.
  if (enemyArmor && _aiTemplateOpensArmour(probe)) weight += 1.5;

  return weight / Math.max(1, price * price * 0.15);
}

// In the battle's likely last round (ai/battle_horizon.js) a unit placed now scores only
// by standing in an Objective Area when the round is scored, and it has only this
// round's walk (or Advance) from `sq` to get there. Placed on their home rows, the Day's
// last-round requisitions did nothing (Champion League D1-M01, M06, M09, M20, M21, M23).
function _aiRequisitionReachesObjective(probe, sq) {
  var reach = getMovementPoints(probe) + (_aiCanAdvance(probe) ? advanceExpectedSuccesses(probe) : 0);
  return (G.objectives || []).some(function(obj) {
    return Math.max(0, chebyshev(sq.col, sq.row, obj.col, obj.row) - 1) <= reach;
  });
}

// The CP the AI keeps for its other commands when it requisitions with no
// reason to (no thin line, no objective nobody holds): a unit is bought then only
// if its price leaves this much. The old gate - any 7 CP held - left 4 after the
// cheapest unit; a 5 CP unit now needs 9 CP in hand, a 7 CP unit 11.
var _AI_REQUISITION_SPARE_CP = 4;

// The unit type and square the AI would requisition with `cmd` (the Troop
// Requisition command), or null.
function _aiLegacyCommandBestTroopRequisition(player, cmd, friendlies, enemies, cp) {
  var hq = _aiGetHQUnit(player);
  if (!hq) return null;
  // Where the command may place the unit: its own answer (troopRequisitionSquares).
  var squares = troopRequisitionSquares(player);
  if (!squares.length) return null;

  // A reason to requisition: a thin line (6 units or fewer) or an objective no
  // friendly body holds. Without one, only with CP to spare after the price
  // (_AI_REQUISITION_SPARE_CP).
  var pressure = friendlies.length <= 6;
  if (!pressure && G.objectives && G.objectives.length) {
    pressure = G.objectives.some(function(obj) {
      return !friendlies.some(function(u) {
        return !u.tags.includes('FLYING') && getEffectiveOC(u) > 0 &&
          inObjectiveAreaOf(obj, u.col, u.row);
      });
    });
  }
  if (!pressure && cp < _AI_REQUISITION_SPARE_CP) return null;

  var best = null;
  var offered = troopRequisitionTemplates(player);
  for (var i = 0; i < offered.length; i++) {
    var tid = offered[i];
    var tpl = UNITS_DATA[tid];
    if (!_aiCommandRequisitionWanted(tpl)) continue;
    // The price the command will be issued at; none when the CP does not cover it.
    var issue = _aiCommandCheapestIssue(player, cmd, { templateId: tid });
    if (!issue) continue;
    if (!pressure && cp - issue.preview.cpCost < _AI_REQUISITION_SPARE_CP) continue;
    var probe = _aiCommandRequisitionProbeUnit(player, tpl, hq);
    var weight = _aiLegacyCommandRequisitionTemplateWeight(player, tpl, probe, friendlies, enemies, issue.preview.cpCost);
    if (weight <= 0) continue;
    var sq = _aiCommandBestSquare(probe, squares);
    if (!sq) continue;
    if (aiBattleRoundsLeft() <= 1 && !_aiRequisitionReachesObjective(probe, sq)) continue;
    var total = weight + Math.max(0, sq.score || 0) * 0.15;
    if (!best || total > best.weight) {
      best = {
        templateId: tid,
        placementSq: { col: sq.col, row: sq.row },
        weight: total,
      };
    }
  }
  return best;
}

// Every unit that could legally issue a command for `player` (the rules' own
// list, commandSourcesOnField), lowest uid first. Recomputed on each call rather
// than memoized for the phase: units are destroyed and recruited DURING a Command
// Phase, so a per-phase cache goes stale and starts previewing dead uids (which
// silently resolve back to the HQ). The cost in here is the previews below,
// which cannot be avoided.
function _aiCommandSources(player) {
  return commandSourcesOnField(player).sort(function(a, b) { return (a.uid || 0) - (b.uid || 0); });
}

// The cheapest way `player` can issue `cmd` at `target`: { preview, uid }, the
// previewHQCommand answer through whichever command-capable unit makes it
// cheapest - the price the command is then issued at - or null when none may.
// The range surcharge is the same whoever issues (measured from the nearest
// friendly command source), but the issuer's own cost modifier (Master of War)
// is not. Ties keep the lowest uid, so the pick is deterministic and replay/MP
// reproduce it.
function _aiCommandCheapestIssue(player, cmd, target) {
  var sources = _aiCommandSources(player);
  var best = null;
  for (var si = 0; si < sources.length; si++) {
    var sp = previewHQCommand(player, cmd.name, target, sources[si].uid);
    if (!sp.ok) continue;
    if (!best || sp.cpCost < best.preview.cpCost) best = { preview: sp, uid: sources[si].uid };
  }
  if (!best) {
    // Nothing previewed through an explicit source - fall back to the default
    // resolution so this stays a superset of the old behaviour.
    var fallback = previewHQCommand(player, cmd.name, target);
    if (!fallback.ok) return null;
    best = { preview: fallback, uid: null };
  }
  return best;
}

function _aiAddHQCandidate(candidates, player, cmd, target, data) {
  data = data || {};
  var best = _aiCommandCheapestIssue(player, cmd, target);
  if (!best) return;
  var preview = best.preview;

  var candidate = {
    player: player,
    cmd: cmd,
    cmdIdx: _aiGetHQCommandIdx(cmd.name),
    target: target,
    sourceUid: best.uid,
    cpCost: preview.cpCost,
    weight: data.weight != null ? data.weight : 1,
    moveDest: data.moveDest || null,
    placementSq: data.placementSq || null,
  };
  if (candidate.weight > 0) candidates.push(candidate);
}
