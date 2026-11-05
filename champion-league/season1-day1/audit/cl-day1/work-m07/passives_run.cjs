const path=require('path');
const {passivesRecord}=require('/home/user/warfront/scripts/battle_report/passives.cjs');
const r=require(path.join(process.env.WARFRONT_OUTPUT_DIR,'battle_reports',process.argv[2],'report.json'));
const p=passivesRecord(r);
console.log(JSON.stringify({attacks:p.attacks,stilled:p.stilled,move:p.move,reach:p.reach},null,1));
console.log('--- by round');
Object.keys(p.rounds).forEach(k=>{console.log('R'+k);p.rounds[k].forEach(l=>console.log('  '+l))});
console.log('--- heals', JSON.stringify(r.passives.heals).slice(0,3000));
