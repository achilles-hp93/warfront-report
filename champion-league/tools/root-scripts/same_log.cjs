// same_log.cjs <day1 report.json> <replay report.json>: is the replay the same battle?
const a = require(process.argv[2]), b = require(process.argv[3]);
const la = a.log.map(e => e.msg), lb = b.log.map(e => e.msg);
let i = 0; while (i < la.length && la[i] === lb[i]) i++;
console.log('day1', JSON.stringify(a.result), 'replay', JSON.stringify(b.result), 'errors', b.errors.length,
  i === la.length && la.length === lb.length ? 'LOG IDENTICAL' : `log diverges at line ${i} of ${la.length}/${lb.length}: ${la[i]} || ${lb[i]}`);
