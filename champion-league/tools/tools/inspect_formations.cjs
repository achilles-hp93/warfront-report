const path = require('path');
const repo = process.argv[2];
process.env.WARFRONT_OUTPUT_DIR = process.argv[3];
const { GameSession } = require(path.join(repo, 'server/src/game_session.js'));
const session = new GameSession('x', { mapIdx: 2, deployType: 'central_faceoff', mode: 'skirmish', skirmishMode: 'seize_the_ground', skipChecksum: true, aiBothSides: true });
session.initGame([{ templateId: 'hq', col: 2, row: 7, isHQ: true }, { templateId: 'atashid_empire:shieldbearers', col: 4, row: 6 }],
  [{ templateId: 'hq', col: 12, row: 7, isHQ: true }, { templateId: 'duat_dominion:skeletal_spearman', col: 10, row: 6 }],
  { factionId: 'atashid_empire' }, { factionId: 'duat_dominion' });
session.beginFirstRound();
const G = session.ctx.G;
const f = G.formations;
console.log('isArray', Array.isArray(f), 'proto', require('vm').runInContext('Array.prototype', session.ctx) === Object.getPrototypeOf(f), 'len', f.length, 'keys', Object.keys(f));
console.log('entry0 type', typeof f[0], f[0] && Object.getPrototypeOf(f[0]) === require('vm').runInContext('Object.prototype', session.ctx), f[0] && Object.keys(f[0]).slice(0, 10));
const copy = session.ctx.aiBattleCopy(new Map());
console.log('copy formations', copy.fields.formations);
