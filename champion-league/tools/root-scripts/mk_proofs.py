import json
D = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/'
patches = {
 'pr_moment.json': [["  return G.round + ':' + G.battlePhase + ':' + G.unitActivationSeq;", "  return G.unitActivationSeq + '|' + (attackActivationStamp() || G.round + ':' + G.battlePhase + ':-');", 2]],
 'pr_aikey.json': [["uid: m.uid, countKey: keys[i], player: m.player", "uid: m.uid, player: m.player", 2]],
 'pr_events.json': [["    if (pairDestructionAnswered(ctx.destruction, unit.uid + '|' + event + '|' + sourceId + '|' + e)) return;\n", "", 2]],
 'pr_pool.json': [["      if (pairDestructionAnswered(opts.destruction, 'pool|' + def.id + '|' + index)) return;\n", "", 2]],
 'pr_leader.json': [["  if (afterThisAttack(function() {\n    if (leader.alive === false) _leaderDeathConsequences(unit, leader, battleLog);\n  })) return;\n", "", 2]],
 'pr_leader_probe.json': [["        if (hasStatus(squad, 'LEADERLESS') || moraleTestTakenThisActivation(squad)) {\n          return 'nothing is set off while", "        if (false) {\n          return 'nothing is set off while"]],
}
for name, pairs in patches.items():
    json.dump(pairs, open(D + name, 'w'))
print('ok')
