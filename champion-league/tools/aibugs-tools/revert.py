#!/usr/bin/env python3
"""Patch my fixes out of a built warfront-fantasy.html (scratch, aibugs).

usage: revert.py <src html> <dst html> <fix ids, comma separated: 1,2,3 or 1a>
Each replacement must occur exactly twice (the engine is in the page twice) - or the
count given - and the script fails loudly otherwise.
"""
import sys

FIXES = {
    # 1: a charge at a joined CHARACTER asks its squad
    '1a': [(
        "function _aiChargeTargetMayLeave(target) {\n  var leaver = footprintLead(target);\n",
        "function _aiChargeTargetMayLeave(target) {\n  var leaver = target;\n",
    )],
    '1': [
        (
            "function _aiChargeTargetMayLeave(target) {\n  var leaver = footprintLead(target);\n",
            "function _aiChargeTargetMayLeave(target) {\n  var leaver = target;\n",
        ),
        (
            "  if (!_aiChargeTargetMayLeave(target)) return { leaves: false, vpGiven: null };\n  var leaver = footprintLead(target);\n",
            "  if (!_aiChargeTargetMayLeave(target)) return { leaves: false, vpGiven: null };\n  var leaver = target;\n",
        ),
        (
            "function _aiChargeLeavingParts(unit, target, sq) {\n  target = footprintLead(target);\n",
            "function _aiChargeLeavingParts(unit, target, sq) {\n",
        ),
        (
            "  var oc = footprintMembers(target).reduce(function(sum, member) { return sum + getEffectiveOC(member); }, 0);\n  var given = aiObjectiveControlChange(target, -oc).lost;\n",
            "  var given = aiObjectiveControlChange(target, -getEffectiveOC(target)).lost;\n",
        ),
    ],
    '1oc': [(
        "  var oc = footprintMembers(target).reduce(function(sum, member) { return sum + getEffectiveOC(member); }, 0);\n  var given = aiObjectiveControlChange(target, -oc).lost;\n",
        "  var given = aiObjectiveControlChange(target, -getEffectiveOC(target)).lost;\n",
    )],
    # 2: the push gives way to a better charge
    '2': [(
        "  if (push.shouldAdvance && !(charge && charge.score > aiAdvanceExpectedScore(unit, push.dest))) {\n",
        "  if (push.shouldAdvance) {\n",
    )],
    # 3: the Action Phase gate asks the attack rules
    '3': [(
        "  if (G.battlePhase === 'ACTION' && _activationEndedThisPhase(unit)) return false;\n"
        "  if (_aiEveryActionForbidden(unit)) return false;\n"
        "  if (!_aiFocusAttackBlocked(unit) && !attackerMeansBlockReason(unit)) return true;\n"
        "  return (unit.ap || 0) > 0 && !unit.attacked && !unit.usedAbilityThisPhase && !unit.usedAction;\n",
        "  if ((unit.ap || 0) <= 0) return false;\n"
        "  if (unit.attacked) return false;\n"
        "  if (unit.usedAbilityThisPhase) return false;\n"
        "  if (unit.usedAction) return false;\n"
        "  return !_aiEveryActionForbidden(unit);\n",
    )],
}

src, dst, ids = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
text = open(src, encoding='utf-8').read()
for fid in ids:
    for new, old in FIXES[fid]:
        n = text.count(new)
        if n != 2:
            sys.exit('fix %s: expected 2 copies, found %d of %r' % (fid, n, new[:80]))
        text = text.replace(new, old)
open(dst, 'w', encoding='utf-8').write(text)
print('reverted', ids, '->', dst)
