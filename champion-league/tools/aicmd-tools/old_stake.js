// The fix patched out: a move off held ground pays the board's VP at W_FB_VP each.
aiPresenceVpAtStake = function(unit, sq) { return aiPresenceVpLost(unit, sq); };
aiPresenceVpRate = function() { return aiW('W_FB_VP'); };
aiPresenceStakePoints = function(unit, sq) { return aiPresenceVpLost(unit, sq) * aiW('W_FB_VP'); };
_aiAbandonMargin = function(unit, sq) { return Math.max(AI_OBJECTIVE_ABANDON_MARGIN, aiPresenceVpLost(unit, sq) * aiW('W_FB_VP')); };
