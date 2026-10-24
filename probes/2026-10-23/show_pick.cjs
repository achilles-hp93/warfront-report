const p = require(process.argv[2]).probe;
const e = p.filter(e => e.err); if (e.length) console.log('ERR', e[0].err.slice(0, 200));
p.filter(e => ['pick', 'decide', 'granted', 'missive', 'actions'].includes(e.kind)).forEach(e => {
  if (e.kind === 'pick') console.log('R' + e.round, 'PICK at', JSON.stringify(e.at), 'holds', e.holds, 'missive', e.missive, 'offStay', e.offStay, 'firePen', e.firePenalty,
    '\n    stay', JSON.stringify(e.stay), '\n    global', JSON.stringify(e.global && [e.global.col, e.global.row, e.global.score, e.global.turnsAway]),
    '\n    pick', JSON.stringify(e.pick), '\n    top', JSON.stringify(e.top));
  else if (e.kind === 'missive') console.log('R' + e.round, 'MISSIVE', JSON.stringify(e.after));
  else if (e.kind === 'actions') console.log('R' + e.round, 'ACTIONS at', JSON.stringify(e.at), JSON.stringify(e.candidates.slice(0, 3)));
  else console.log('R' + e.round, e.kind.toUpperCase(), JSON.stringify(e).slice(0, 250));
});
