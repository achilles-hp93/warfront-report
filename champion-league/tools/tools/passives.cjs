const path=require('path');
const { passivesRecord } = require(path.resolve('/home/user/warfront/scripts/battle_report/passives.cjs'));
const r = require(process.argv[2]);
console.log(JSON.stringify(passivesRecord(r), null, 1).slice(0, 6000));
