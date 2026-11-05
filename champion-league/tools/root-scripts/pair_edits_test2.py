import os
ROOT = '/home/user/warfront/.claude/worktrees/agent-aaa560e5e71b98a9d'
p50 = os.path.join(ROOT, 'tests/suites/joined_units/050_melee.js')
s = open(p50).read()
start = s.index("  {\n    suiteId: 'suiteJoinedUnits',\n    test: { name: 'A pair strikes, counterattacks")
end = s.index("  {\n    suiteId: 'suiteJoinedUnits',\n    test: { name: 'Both units of a pair strike back")
s = s[:start] + s[end:]
open(p50, 'w').write(s)

p30 = os.path.join(ROOT, 'tests/suites/joined_units/030_move_and_morale.js')
s = open(p30).read()
old = '''        if (Stats.unit(legatus, 'PER').value === Stats.unit(squad, 'PER').value) return 'any other characteristic stays each unit\\'s own: their PER differ';
        endJoinedPair(squad);'''
new = '''        if (Stats.unit(legatus, 'PER').value === Stats.unit(squad, 'PER').value) return 'any other characteristic stays each unit\\'s own: their PER differ';
        // ...wherever INI is read: each unit's counterattack and the CHARACTER's own
        // attack (_meleeExchangeStrikers), the pair's one Fall Back test, and the pair
        // holding an enemy that falls back (fallBackTestOdds) - which the AI reads too.
        var enemy = _place(createUnit('grand_duchy_of_albion:sidhe_wardens', 1), 5, 7);
        legatus.ap = 1; squad.ap = 1;
        var counters = _meleeExchangeStrikers(enemy, squad, Weapons.first(enemy, 'melee'), {}).strikers
          .filter(function(s) { return s.counter; });
        if (counters.length !== 2) return 'fixture: both units counterattack, got ' + counters.length;
        if (counters.some(function(s) { return s.initiative.total !== 4; })) {
          return 'each counterattacks at the pair\\'s INI 4: ' + counters.map(function(s) { return s.unit.name + ' ' + s.initiative.total; }).join(', ');
        }
        var own = _meleeExchangeStrikers(legatus, enemy, Weapons.first(legatus, 'melee'), {}).strikers
          .filter(function(s) { return !s.counter; })[0];
        if (own.initiative.total !== 4) return 'the CHARACTER attacks at the pair\\'s INI 4, got ' + own.initiative.total;
        var test = fallBackTestOdds(squad);
        if (test.waiver || test.ini !== 4) return 'the pair\\'s one Fall Back test is at its INI 4, got ' + (test.waiver || test.ini);
        var held = fallBackTestOdds(enemy);
        if (held.waiver || held.holdINI !== 4) return 'an enemy falling back from the pair meets the pair\\'s INI 4, got ' + (held.waiver || held.holdINI);
        endJoinedPair(squad);'''
assert s.count(old) == 1
s = s.replace(old, new)
open(p30, 'w').write(s)
print('ok')
