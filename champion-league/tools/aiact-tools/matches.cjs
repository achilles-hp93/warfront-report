const fs = require('fs');
const S = '/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad';
const d = JSON.parse(fs.readFileSync(S + '/cl-shadow2/tournaments/cl-s1/state.json', 'utf8'));
console.log(JSON.stringify(d.config));
d.days[0].matches.forEach(m => console.log(m.id, m.seed, m.a.faction + '/' + m.a.formation, m.b.faction + '/' + m.b.formation, JSON.stringify(m.result || null).slice(0, 120)));
