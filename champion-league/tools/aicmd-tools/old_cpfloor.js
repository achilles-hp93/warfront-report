// The fix patched out: _aiAddHQCandidate as it was, no CP floor.
_aiAddHQCandidate = function(candidates, player, cmd, target, data) {
  data = data || {};
  var best = _aiCommandCheapestIssue(player, cmd, target);
  if (!best) return;
  var preview = best.preview;
  var candidate = {
    player: player, cmd: cmd, cmdIdx: _aiGetHQCommandIdx(cmd.name), target: target, sourceUid: best.uid,
    cpCost: preview.cpCost, weight: data.weight != null ? data.weight : 1,
    moveDest: data.moveDest || null, placementSq: data.placementSq || null,
  };
  if (candidate.weight > 0) candidates.push(candidate);
};
