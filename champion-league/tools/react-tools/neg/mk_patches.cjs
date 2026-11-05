// Write the negative-proof patch files (each [{old, new}], applied to every copy in the page).
const fs = require('fs'), path = require('path');
const w = (f, x) => fs.writeFileSync(path.join(__dirname, f), JSON.stringify(x));
w('no_reactions.json', [
  { old: 'function _aiChargeReactedScore(unit, options, value, score) {', new: 'function _aiChargeReactedScore(unit, options, value, score) { return score;' },
  { old: "      - aiW('W_DRAWN_REACTIONS') * aiChargeReactionLoss(own.reactions, odds, own.fight);", new: ';' },
]);
w('no_routing.json', [
  { old: '  if (entry && entry.asCharge) {', new: '  if (false) {' },
  { old: 'var pick = charging ? aiOrderedChargeSquare(unit, squares) : aiChooseDestination', new: 'var pick = false ? aiOrderedChargeSquare(unit, squares) : aiChooseDestination' },
  { old: 'var score = charging ? pick.score : aiScoreDestination(unit, pick);', new: 'var score = aiScoreDestination(unit, pick);' },
  { old: 'if (run && run.charge) return aiOrderedChargeSquare(unit, squares);', new: ';' },
]);
w('no_drawn.json', [
  { old: 'var drawn = rangedChoices.length ? aiAttackDrawnCost(unit, target) : 0;', new: 'var drawn = 0;' },
  { old: 'var drawn = values.length ? aiAttackDrawnCost(watcher, target) / Math.max(aiTargetValue(target), 1e-9) : 0;', new: 'var drawn = 0;' },
]);
w('no_peek.json', [{ old: '  if (!peek) markRound(unit, mark);', new: '  markRound(unit, mark);' }]);
console.log('patches written');
