import sys, shutil
# usage: r5_neg.py <variant>  - restore the pristine copy, then patch one change out.
D = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/rules5-neg/'
VARIANTS = {
    # Item 1: the table without its 0 floor, the MS reading's clamp back where it was.
    'ini_floor': [
        ("  return d6ContestThreshold(atkMS, defMS);",
         "  return d6ContestThreshold(Math.max(0, Number(atkMS) || 0), Math.max(0, Number(defMS) || 0));"),
        ("  own = Math.max(0, Number(own) || 0);\n  opposing = Math.max(0, Number(opposing) || 0);\n", ""),
    ],
    # Item 2: the granted Charge back on the plain no-Reactions move.
    'granted_charge': [
        ("  if (pending.asCharge) return _applyGrantedCharge(unit, pending, col, row, onDeferredComplete);\n", ""),
    ],
    # Item 2: the granted Charge as it was - a Charge, resolved on arrival, provoking
    # nothing: no Countercharge offer, and its move with noReactions.
    'granted_charge_noreact': [
        ("  var declared = ruleResult(function(resolve) { offerCountercharge(unit, col, row, resolve); });",
         "  var declared = null;"),
        ("    orderedCharge: true,\n    maxMove: pending.allowance,",
         "    orderedCharge: true,\n    noReactions: true,\n    maxMove: pending.allowance,"),
    ],
    # Item 2: an ordered CHARGE skips the Countercharge again.
    'ordered_countercharge': [
        ("  if (opts.countercharge === false) return _rollAndResolveCharge(unit, col, row, opts, false);",
         "  if (opts.ordered) return _rollAndResolveCharge(unit, col, row, opts, false);"),
    ],
    # Item 2: a canceled CHARGE does not settle for the rule that ordered it.
    'canceled_settles': [
        ("    MoveHost.chargeCanceled(unit, paused);\n    if (typeof opts.onSettled === 'function') opts.onSettled(outcome);",
         "    MoveHost.chargeCanceled(unit, paused);"),
    ],
    # Item 2: a Countercharge's own CHARGE is countercharged.
    'countercharge_own': [
        ("ordered: true, countercharge: false, settleAfterReactions: true, onSettled: finish,",
         "ordered: true, settleAfterReactions: true, onSettled: finish,"),
    ],
    # Item 2: every unit a compelled CHARGE ends beside decides who answers it.
    'compelled_filter': [
        ("return getChargeTargets(charger, col, row).filter(function(t) { return t.player !== charger.player; });",
         "return getChargeTargets(charger, col, row);"),
    ],
    # Item 2: Fire After Enemy Charge hears one Charge a round.
    'heard_mark': [
        ("    clearRoundMark(member, 'fire_after_charge_heard');\n", ""),
    ],
}
v = sys.argv[1]
shutil.copyfile(D + 'pristine.html', D + 'warfront-fantasy.html')
if v == 'none':
    print('restored'); sys.exit(0)
s = open(D + 'warfront-fantasy.html', encoding='utf-8').read()
for old, new in VARIANTS[v]:
    n = s.count(old)
    if n != 2:
        sys.exit('%s: expected 2 occurrences (the engine twice), got %d: %r' % (v, n, old[:60]))
    s = s.replace(old, new)
open(D + 'warfront-fantasy.html', 'w', encoding='utf-8').write(s)
print('patched', v)
