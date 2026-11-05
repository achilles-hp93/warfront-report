(function(){
  var out = {};
  ['saveRoll','def','ward_roll','ward','DEF','fnp','hp','hpMax','ms','bs','ini','move','per','oc','morale_test','save','invul','evasion'].forEach(function(s) {
    var r = RulesCatalog.resolveOperationStat('mod_stat', s);
    out[s] = r ? [r.canonical, r.domain, r.runtimeKey] : null;
  });
  return out;
})()
