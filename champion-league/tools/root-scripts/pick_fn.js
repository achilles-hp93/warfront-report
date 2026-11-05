function aiPickPrimaryMission(player, cards, canMulligan) {
  cards = cards || [];
  var fits = cards.filter(function(card) { return primaryMissionFitsArmy(card, player); });
  if (!fits.length) {
    if (canMulligan) return PRIMARY_MULLIGAN_OPTION;
    var best = null;
    cards.forEach(function(card) {
      if (!best || (card.ai_pick_priority || 0) > (best.ai_pick_priority || 0)) best = card;
    });
    return best ? best.id : null;
  }
  return aiBestPrimaryMission(player, fits).card.id;
}

