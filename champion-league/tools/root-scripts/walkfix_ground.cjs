// scratch: GROUND-LOSES rows, the push vs walk terms
const fs=require('fs');const D='/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/r5idle';
const rows=JSON.parse(fs.readFileSync(D+'/cat_r1_final.json','utf8')).filter(r=>r.cat===(process.argv[2]||'GROUND-LOSES'));
const seen={};
for(const r of rows){const P=JSON.parse(fs.readFileSync(`${D}/probe/m${r.m}/probe.json`,'utf8'));
 const mv=P.moves.filter(m=>m.round===1&&m.members.indexOf(r.name)>=0);
 for(const m of mv){const k=r.m+m.unit+m.at; if(seen[k])continue; seen[k]=1; const p=m.push||{};
  console.log(`M${r.m} ${m.unit}@${m.at} MOVE${m.move} out=${JSON.stringify(m.out)} pick=${JSON.stringify(m.pick)} far=${JSON.stringify(m.far)} stay=${m.stay} fire=${m.firePenalty}`);
  console.log(`   push ${p.refused||''} dest=${p.dest} exp=${p.expected} floor=${p.floor} forg=${p.forgone} rolls=${(p.rolls||[]).map(x=>x.p+':'+x.sq+'='+x.score).join(' ')} why=${JSON.stringify(p.why||null)}`);
  if(p.walkBd) console.log(`   walk ${JSON.stringify(p.walkBd)}\n   roll ${JSON.stringify(p.rollBd)}`);
 }}
