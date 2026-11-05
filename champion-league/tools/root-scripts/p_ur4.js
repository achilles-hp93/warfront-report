(function(){
  var out = {};
  _withCleanBoard(function(){
    var saved = { round: G.round, bp: G.battlePhase };
    G.round = 2; G.battlePhase = 'ACTION';
    try {
      var rider = _place(createUnit('golden_khaganate:stormrider', 0), 7, 8);
      var foe = _place(createUnit('infernal_congregations:furyforged_berserkers', 1), 7, 7);
      foe.intelLevel = [1, 1];
      markFellBackFrom(rider); placeFootprint(rider, 7, 11);
      markRound(rider, 'universal_ruler');
      var w = Weapons.groups(rider, 'ranged')[0];
      var opts = getWeaponOpts(rider, w.weapon, foe);
      opts.firingModels = w.count || w.modelCount || 1;
      opts.fr = (opts.fr || w.weapon.fr || 1) * (opts.firingModels);
      opts._noAttackTrack = true;
      var lines = [];
      var origLog = battleLog;
      var cap = function(m) { lines.push(typeof m === 'string' ? m : JSON.stringify(m)); };
      var r = withRulesReading ? null : null;
      // Capture combat-effect application on the resolver ctx
      var orig = fireCombatHook, seen = [];
      fireCombatHook = function(hook, ctx) {
        var before = { ar: ctx.grpAR, dmg: ctx.grpWeapon && ctx.grpWeapon.dmg, ap: ctx.grpWeapon && ctx.grpWeapon.ap };
        var res = orig(hook, ctx);
        if (hook === 'modifyDicePool' || hook === 'modifyWeapon') seen.push({ hook: hook, effects: ctx.effects, before: before, after: { ar: ctx.grpAR, dmg: ctx.grpWeapon && ctx.grpWeapon.dmg, ap: ctx.grpWeapon && ctx.grpWeapon.ap }, pre: ctx.grpWeapon && ctx.grpWeapon._appliedCombatProfileEffects });
        return res;
      };
      try { resolveAttack(rider, foe, opts); } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
      fireCombatHook = orig;
      out.group = { count: w.count, modelCount: w.modelCount, fr: w.weapon.fr, dmg: w.weapon.dmg, ap: w.weapon.ap, applied: w.weapon._appliedCombatProfileEffects };
      out.seen = seen;
    } finally { G.round = saved.round; G.battlePhase = saved.bp; }
  });
  return out;
})()
