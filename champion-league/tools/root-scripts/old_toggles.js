// -----------------------------------------------------------------------------
// ai/action/toggles_used.js - the TOGGLE abilities the AI has used this turn.
//
// A toggle is a choice of mode. Once the AI has flipped one, it keeps that mode
// for the turn: the toggle's score sees the same board after the flip as
// before it, so a free toggle (Gas Shells' toggle_weapon costs no APt) was
// otherwise undone and redone for ever, and the turn never ended. The memory
// is the AI's own, not battle state, scoped like its failed actions
// (_aiCurrentActionScopeKey, ai/action/candidate_helpers.js: the phase, the
// player and the Battle Round), so it empties when the next of them starts - a
// unit activates once a phase.
// -----------------------------------------------------------------------------

'use strict';

var _aiTogglesUsedScopeKey = null;
var _aiTogglesUsed = new Set();

function _aiToggleUsedKey(unit, ability) {
  return unit && ability ? unit.uid + '|' + (ability.id || ability.abilityId || ability.name) : null;
}

function _aiSyncTogglesUsedScope() {
  var scopeKey = _aiCurrentActionScopeKey();
  if (_aiTogglesUsedScopeKey !== scopeKey) {
    _aiTogglesUsedScopeKey = scopeKey;
    _aiTogglesUsed = new Set();
  }
}

// The AI has chosen to use `unit`'s TOGGLE `ability` this turn.
function aiRememberToggleUsed(unit, ability) {
  _aiSyncTogglesUsedScope();
  var key = _aiToggleUsedKey(unit, ability);
  if (key) _aiTogglesUsed.add(key);
}

// Has the AI already used `unit`'s TOGGLE `ability` this turn?
function aiToggleUsedThisTurn(unit, ability) {
  _aiSyncTogglesUsedScope();
  var key = _aiToggleUsedKey(unit, ability);
  return !!key && _aiTogglesUsed.has(key);
}
