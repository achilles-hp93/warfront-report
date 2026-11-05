// Patch-out (scratch): the Movement Phase counted as ahead only in the Movement Phase.
aiMovementStillAhead = function() { return G.battlePhase === 'MOVEMENT'; };
