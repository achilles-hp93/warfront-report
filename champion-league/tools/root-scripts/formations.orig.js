// Generic battlefield formation recognition, membership, modifiers, and links.

'use strict';

var Formations = (function() {
  var _rulesets = [];
  var _linkThickness = 0.16;

  function _clone(value) {
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(_clone);
    var out = {};
    Object.keys(value).forEach(function(key) { out[key] = _clone(value[key]); });
    return out;
  }

  // An indexed walk rather than keys().forEach(): this runs on every returned
  // result object, and the callback allocated a closure per object per read.
  function _freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) _freeze(value[keys[i]]);
    return Object.freeze(value);
  }

  function _unitKey(unit) {
    if (!unit) return null;
    if (unit.uid != null) return String(unit.uid);
    if (unit.id != null) return String(unit.id);
    return (unit.name || 'unit') + '@' + unit.col + ',' + unit.row;
  }

  function _canonicalModifier(modifier, formationId) {
    var record = _clone(modifier || {});
    var domain = String(record.domain || '');
    if (!((RulesCatalog.data || {}).modifier_domains || {})[domain]) {
      throw new Error('Formation ' + formationId + ' has unknown modifier domain ' + JSON.stringify(domain));
    }
    var stat = RulesCatalog.normalize(domain, record.stat);
    if (!stat) throw new Error('Formation ' + formationId + ' has unknown ' + domain + ' stat ' + JSON.stringify(record.stat));
    record.domain = domain;
    record.stat = stat;
    if (domain === 'save-threshold') {
      record.threshold = Number(record.threshold);
      if (!Number.isFinite(record.threshold) || record.threshold <= 0) {
        throw new Error('Formation ' + formationId + ' has invalid threshold');
      }
      delete record.amount;
    } else {
      record.amount = Number(record.amount);
      if (!Number.isFinite(record.amount)) throw new Error('Formation ' + formationId + ' has invalid modifier amount');
    }
    return record;
  }

  function _canonicalDefinition(raw, ruleset) {
    var definition = _clone(raw || {});
    if (!definition.id || !definition.name || !definition.attribute) {
      throw new Error('Formation definitions require id, name, and attribute');
    }
    if (!Array.isArray(definition.patterns) || !definition.patterns.length) {
      throw new Error('Formation ' + definition.id + ' requires patterns');
    }
    definition.patterns = definition.patterns.map(function(pattern) {
      if (!Array.isArray(pattern) || pattern.length < 1) throw new Error('Formation ' + definition.id + ' has an invalid pattern');
      var required = 0;
      var normalized = pattern.map(function(row) {
        var value = String(row || '');
        if (!value || /[^ox]/.test(value)) throw new Error('Formation ' + definition.id + ' patterns use only o and x');
        required += value.replace(/x/g, '').length;
        return value;
      });
      if (required < 3) throw new Error('Formation ' + definition.id + ' patterns require at least three units');
      return normalized;
    });
    definition.priority = Number(definition.priority || 0);
    definition.faction = ruleset.faction;
    definition.attributeName = definition.attributeName || definition.attribute;
    definition.modifiers = (definition.modifiers || []).map(function(modifier) {
      return _canonicalModifier(modifier, definition.id);
    });
    return definition;
  }

  function register(rawRuleset) {
    rawRuleset = rawRuleset || {};
    if (!rawRuleset.faction || !Array.isArray(rawRuleset.definitions)) {
      throw new Error('Formation rulesets require faction and definitions');
    }
    var ruleset = {
      faction: String(rawRuleset.faction),
      aliases: _clone(rawRuleset.aliases || {}),
      attributes: _clone(rawRuleset.attributes || {}),
    };
    ruleset.definitions = rawRuleset.definitions.map(function(definition) {
      return _canonicalDefinition(definition, ruleset);
    });
    _rulesets = _rulesets.filter(function(existing) { return existing.faction !== ruleset.faction; });
    _rulesets.push(_freeze(ruleset));
    return ruleset.faction;
  }

  function _rulesetForPlayer(player, context) {
    context = context || {};
    if (context.faction) return _rulesets.find(function(ruleset) { return ruleset.faction === context.faction; }) || null;
    var units = _units(context);
    for (var i = 0; i < units.length; i++) {
      if (units[i] && units[i].player === player) {
        var byUnit = _rulesets.find(function(ruleset) { return ruleset.faction === units[i].faction; });
        if (byUnit) return byUnit;
      }
    }
    var factionId = getPlayerFactionId(player);
    return _rulesets.find(function(ruleset) { return ruleset.faction === factionId; }) || null;
  }

  function _rulesetForUnit(unit) {
    return _rulesets.find(function(ruleset) { return ruleset.faction === (unit && unit.faction); }) || null;
  }

  function _units(context) {
    if (context && Array.isArray(context.units)) return context.units;
    return Array.isArray(G.units) ? G.units : [];
  }

  function _position(unit, context) {
    var positions = context && context.positions;
    var override = positions && positions[_unitKey(unit)];
    if (!override && positions && unit && unit.uid != null) override = positions[unit.uid];
    return override ? { col: Number(override.col), row: Number(override.row) }
      : { col: Number(unit.col), row: Number(unit.row) };
  }

  function _dimensions(context) {
    if (context && context.boardDimensions) return _clone(context.boardDimensions);
    if (context && Array.isArray(context.board) && context.board.length && Array.isArray(context.board[0])) {
      return { cols: context.board[0].length, rows: context.board.length };
    }
    return getBoardDimensions();
  }

  function _occupancy(context) {
    var occupied = {};
    _units(context).forEach(function(unit) {
      if (!unit || !unit.alive) return;
      var position = _position(unit, context);
      if (position.col < 0 || position.row < 0) return;
      occupied[position.col + ',' + position.row] = unit;
    });
    return occupied;
  }

  function _cell(leftCol, frontRow, player, localCol, localRow) {
    var backDirection = Number(player) === 0 ? 1 : -1;
    return { col: leftCol + localCol, row: frontRow + localRow * backDirection };
  }

  function _match(player, ruleset, definition, pattern, patternIndex, leftCol, frontRow, occupied, dimensions) {
    var units = [];
    var unitKeys = {};
    var cells = [];
    for (var rowIndex = 0; rowIndex < pattern.length; rowIndex++) {
      for (var colIndex = 0; colIndex < pattern[rowIndex].length; colIndex++) {
        var square = _cell(leftCol, frontRow, player, colIndex, rowIndex);
        if (square.col < 0 || square.row < 0 || square.col >= dimensions.cols || square.row >= dimensions.rows) return null;
        var occupant = occupied[square.col + ',' + square.row] || null;
        var symbol = pattern[rowIndex].charAt(colIndex);
        if (symbol === 'x') {
          if (occupant) return null;
          continue;
        }
        if (!occupant || !occupant.alive || occupant.player !== player
            || occupant.faction !== ruleset.faction) return null;
        var key = _unitKey(occupant);
        if (unitKeys[key]) return null;
        unitKeys[key] = true;
        units.push(occupant);
        cells.push(square);
      }
    }
    return {
      id: definition.id,
      name: definition.name,
      faction: ruleset.faction,
      attribute: definition.attribute,
      attributeName: definition.attributeName,
      priority: definition.priority,
      units: units,
      unitKeys: units.map(_unitKey).sort(),
      cells: cells,
      frontRow: frontRow,
      leftCol: leftCol,
      pattern: pattern.slice(),
      patternIndex: patternIndex,
    };
  }

  function _candidateSort(left, right) {
    if (left.unitKeys.length !== right.unitKeys.length) return right.unitKeys.length - left.unitKeys.length;
    if (left.priority !== right.priority) return left.priority - right.priority;
    if (left.frontRow !== right.frontRow) return left.frontRow - right.frontRow;
    if (left.leftCol !== right.leftCol) return left.leftCol - right.leftCol;
    if (left.patternIndex !== right.patternIndex) return left.patternIndex - right.patternIndex;
    return left.unitKeys.join('|').localeCompare(right.unitKeys.join('|'));
  }

  function _surging(counts, attributes) {
    var best = null;
    var bestCount = 0;
    var tied = false;
    Object.keys(attributes || {}).forEach(function(attribute) {
      var count = Number(counts[attribute] || 0);
      if (count > bestCount) {
        best = attribute;
        bestCount = count;
        tied = false;
      } else if (count > 0 && count === bestCount) tied = true;
    });
    return bestCount > 0 && !tied ? best : null;
  }

  // A side's formations are a function of each unit's square, side, faction and
  // emplacement, the board's size and the side's ruleset - and nothing else. Every
  // stat a unit of a formation faction reads asks for them, and the AI reads
  // thousands while it scores squares, so each answer is kept under that key: the
  // key is one pass over the units, the scan every pattern at every square (a
  // Great Tang Empire battle's AI froze the page for 45 seconds at a time). The state
  // holds uids, never units.
  var _evaluated = new Map();
  var _EVALUATED_MAX = 256;

  function _evaluationKey(player, ruleset, dimensions, context) {
    var parts = [player, ruleset.faction, _rulesets.length, dimensions.cols, dimensions.rows];
    var units = _units(context);
    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      if (!unit || !unit.alive) continue;
      var position = _position(unit, context);
      parts.push(_unitKey(unit) + '@' + position.col + ',' + position.row + ':' + unit.player + ':' + unit.faction);
    }
    return parts.join('|');
  }

  function evaluate(player, context) {
    context = context || {};
    if (context._formationStateByPlayer && context._formationStateByPlayer[player]) {
      return context._formationStateByPlayer[player];
    }
    var ruleset = _rulesetForPlayer(player, context);
    if (!ruleset) {
      return _freeze({ player: player, faction: null, formations: [], counts: {}, surgingAttribute: null, surgingAttributeName: null, unitFormation: {} });
    }
    var dimensions = _dimensions(context);
    var key = _evaluationKey(player, ruleset, dimensions, context);
    var known = _evaluated.get(key);
    if (known) return known;
    var occupied = _occupancy(context);
    var candidates = [];
    ruleset.definitions.forEach(function(definition) {
      definition.patterns.forEach(function(pattern, patternIndex) {
        var width = pattern.reduce(function(maximum, row) { return Math.max(maximum, row.length); }, 0);
        for (var row = 0; row < dimensions.rows; row++) {
          for (var col = 0; col <= dimensions.cols - width; col++) {
            var match = _match(player, ruleset, definition, pattern, patternIndex, col, row, occupied, dimensions);
            if (match) candidates.push(match);
          }
        }
      });
    });
    candidates.sort(_candidateSort);

    var assigned = {};
    var unitFormation = {};
    var formations = [];
    var counts = {};
    Object.keys(ruleset.attributes).forEach(function(attribute) { counts[attribute] = 0; });
    candidates.forEach(function(candidate) {
      if (candidate.unitKeys.some(function(key) { return assigned[key]; })) return;
      var record = {
        id: candidate.id,
        name: candidate.name,
        faction: candidate.faction,
        attribute: candidate.attribute,
        attributeName: candidate.attributeName,
        player: player,
        units: candidate.units.map(function(unit) { return unit.uid; }),
        unitKeys: candidate.unitKeys.slice(),
        cells: candidate.cells.map(_clone),
        frontRow: candidate.frontRow,
        leftCol: candidate.leftCol,
        pattern: candidate.pattern.slice(),
        patternIndex: candidate.patternIndex,
      };
      formations.push(record);
      counts[candidate.attribute] = Number(counts[candidate.attribute] || 0) + 1;
      candidate.units.forEach(function(unit) {
        var key = _unitKey(unit);
        assigned[key] = true;
        unitFormation[key] = record;
      });
    });
    var surge = _surging(counts, ruleset.attributes);
    var state = _freeze({
      player: player,
      faction: ruleset.faction,
      formations: formations,
      counts: counts,
      surgingAttribute: surge,
      surgingAttributeName: surge ? ruleset.attributes[surge] : null,
      unitFormation: unitFormation,
    });
    if (_evaluated.size >= _EVALUATED_MAX) _evaluated.clear();
    _evaluated.set(key, state);
    return state;
  }

  function forUnit(unit, context) {
    if (!unit || unit.player == null || !unit.alive) return null;
    var position = _position(unit, context || {});
    if (position.col < 0 || position.row < 0 || !_rulesetForUnit(unit)) return null;
    var state = evaluate(unit.player, context || {});
    return state.unitFormation[_unitKey(unit)] || null;
  }

  function _definition(formation) {
    if (!formation) return null;
    var ruleset = _rulesets.find(function(item) { return item.faction === formation.faction; });
    return ruleset && ruleset.definitions.find(function(item) { return item.id === formation.id; }) || null;
  }

  function modifiers(unit, context) {
    var formation = forUnit(unit, context || {});
    var definition = _definition(formation);
    if (!formation || !definition) return _freeze([]);
    var records = definition.modifiers.map(function(modifier, index) {
      var record = _clone(modifier);
      record.recordId = 'formation|' + formation.id + '|' + record.domain + '|' + record.stat + '|' + index;
      record.sourceId = formation.id;
      record.sourceName = formation.name;
      record.stacking = 'refresh';
      record.uncapped = !!record.uncapped;
      record.duration = { type: 'condition', id: 'while_in_formation' };
      return record;
    });
    return _freeze(records);
  }

  function _filtered(unit, domain, stat, context) {
    var canonical = stat == null ? null : RulesCatalog.normalize(domain, stat);
    return _freeze(modifiers(unit, context || {}).filter(function(record) {
      return record.domain === domain && (!canonical || record.stat === canonical);
    }).map(_clone));
  }

  function modelModifiers(unit, model, stat, context) {
    return _filtered(unit, 'model-stat', stat, context);
  }

  function testModifiers(unit, channel, context) {
    return _filtered(unit, 'test-channel', channel, context);
  }

  // The formation's modifiers to the HIT rolls its members make (Azure Dragon).
  function hitRollModifiers(unit, context) {
    return _filtered(unit, 'hit-roll', 'HIT', context);
  }

  function weaponModifiers(unit, model, weapon, context) {
    return _freeze(_filtered(unit, 'weapon-stat', null, context).filter(function(record) {
      return Weapons.matchesScope(weapon, record.scope);
    }).map(_clone));
  }

  function weaponTags(unit, model, weapon, context) {
    return _freeze(_filtered(unit, 'weapon-tag', null, context).filter(function(record) {
      return Weapons.matchesScope(weapon, record.scope);
    }).map(_clone));
  }

  function threshold(unit, rawStat, currentThreshold, context) {
    var thresholdValue = Number(currentThreshold || 0);
    _filtered(unit, 'save-threshold', rawStat, context).forEach(function(record) {
      thresholdValue = thresholdValue > 0 ? Math.min(thresholdValue, record.threshold) : record.threshold;
    });
    return thresholdValue;
  }

  function _linkPairs(points) {
    if (!points || points.length < 2) return [];
    var parent = points.map(function(_point, index) { return index; });
    var pairs = [];
    function find(index) {
      while (parent[index] !== index) {
        parent[index] = parent[parent[index]];
        index = parent[index];
      }
      return index;
    }
    function union(left, right) {
      var leftRoot = find(left);
      var rightRoot = find(right);
      if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
    }
    for (var i = 0; i < points.length; i++) {
      for (var j = i + 1; j < points.length; j++) {
        if (Math.max(Math.abs(points[i].col - points[j].col), Math.abs(points[i].row - points[j].row)) > 1) continue;
        pairs.push([i, j]);
        union(i, j);
      }
    }
    while (true) {
      var roots = {};
      for (var pointIndex = 0; pointIndex < points.length; pointIndex++) roots[find(pointIndex)] = true;
      if (Object.keys(roots).length <= 1) break;
      var distance = Infinity;
      var nearest = [];
      for (var left = 0; left < points.length; left++) {
        for (var right = left + 1; right < points.length; right++) {
          if (find(left) === find(right)) continue;
          var colDelta = points[left].col - points[right].col;
          var rowDelta = points[left].row - points[right].row;
          var candidateDistance = colDelta * colDelta + rowDelta * rowDelta;
          if (candidateDistance < distance) {
            distance = candidateDistance;
            nearest = [[left, right]];
          } else if (candidateDistance === distance) nearest.push([left, right]);
        }
      }
      if (!nearest.length) break;
      nearest.forEach(function(pair) {
        pairs.push(pair);
        union(pair[0], pair[1]);
      });
    }
    return pairs;
  }

  function links(formation) {
    if (!formation || !Array.isArray(formation.units) || !Array.isArray(formation.cells)) return _freeze([]);
    var points = formation.cells.map(function(cell, index) {
      return { unitId: formation.units[index], col: cell.col, row: cell.row };
    });
    return _freeze(_linkPairs(points).map(function(pair, index) {
      var from = points[pair[0]];
      var to = points[pair[1]];
      return {
        id: formation.id + '|' + formation.patternIndex + '|link|' + index,
        fromUnitId: from.unitId,
        toUnitId: to.unitId,
        from: { col: from.col, row: from.row },
        to: { col: to.col, row: to.row },
        thickness: _linkThickness,
      };
    }));
  }

  function definitions(faction) {
    var ruleset = _rulesets.find(function(item) { return item.faction === faction; });
    return _freeze(ruleset ? ruleset.definitions.map(_clone) : []);
  }

  function snapshot(context, units) {
    context = context || {};
    if (!context._formationStateByPlayer) context._formationStateByPlayer = {};
    (units || []).forEach(function(unit) {
      if (!unit || unit.player == null || context._formationStateByPlayer[unit.player]) return;
      context._formationStateByPlayer[unit.player] = evaluate(unit.player, context);
    });
    return context._formationStateByPlayer;
  }

  return Object.freeze({
    register: register,
    definitions: definitions,
    evaluate: evaluate,
    forUnit: forUnit,
    modifiers: modifiers,
    modelModifiers: modelModifiers,
    testModifiers: testModifiers,
    hitRollModifiers: hitRollModifiers,
    weaponModifiers: weaponModifiers,
    weaponTags: weaponTags,
    threshold: threshold,
    links: links,
    snapshot: snapshot,
    linkThickness: _linkThickness,
  });
})();


// Formations were the original read-time contributor: Stats and Weapons named
// them directly. They now register like anyone else, so the composing functions
// hold no reference to this module. Unguarded on purpose - if the registry has
// not loaded yet, that is a MODULE_LOAD_ORDER bug and it should say so loudly
// rather than silently dropping every formation bonus in the game.
registerModifierContributor({
  id: 'formations',
  modelStats: Formations.modelModifiers,
  testChannels: Formations.testModifiers,
  hitRolls: Formations.hitRollModifiers,
  weaponStats: Formations.weaponModifiers,
  weaponTags: Formations.weaponTags,
});
