// The dashboard store's documents: one per dataset (its uploaded file), the meta and the page.
//   node make_batch.cjs <urls.json> <out dir>   (urls.json: { "<dataset id>": "/_blob/..." })
const fs = require('fs');
const path = require('path');
const [urlsFile, outDir] = process.argv.slice(2);
const urls = JSON.parse(fs.readFileSync(urlsFile, 'utf8'));
const at = new Date().toISOString();
const D = {
  headline: ['Headline figures', 'The pooled figures the page quotes, worked out from every timed battle and the decision-quality battles.'],
  perf_battles: ['Timed battles', 'One row per timed battle: its length, the AI time, turn times, memory, time frozen and UI redraws.'],
  turn_times: ['Turn and choice times', 'Every AI turn and other AI choice timed, grouped by phase, by the action chosen, deployment and reaction seam.'],
  ai_stages: ['Stages inside a turn', 'The time and calls of each AI stage inside the timed turns, inclusive of the stages inside it.'],
  slowest_turns: ['Slowest decisions', 'The 20 slowest AI decisions over the timed battles, with the stage inside each that took longest.'],
  profile_areas: ['Busy time by area', 'Every profiled function\'s own time, summed by the engine folder it lives in; garbage collection and browser internals apart.'],
  profile_functions: ['Top functions by own time', 'The 30 functions with the most time of their own across the CPU profiles of the timed battles.'],
  ai_calls: ['AI functions by total time', 'The AI\'s own functions by the time spent in them and everything they call, from the CPU profiles.'],
  memory_rounds: ['Memory by round', 'The page\'s JavaScript heap, DOM nodes and event listeners at each Battle Round\'s start and the end of each timed battle.'],
  quality: ['Decision quality by matchup', 'Idle rounds, moves undone, objectives left empty, charges and secondaries, per matchup, from the battles\' records.'],
  fallbacks: ['Fall Back verdicts', 'Every Fall Back decision in the two full-record batches, judged by the report\'s Fall Back record.'],
  commands: ['Commands that bought nothing', 'The 24 most used commands, abilities and spells in the two full-record batches, and how often each bought nothing.'],
  fixes: ['Before and after the fixes', 'The same 12 seeds of two matchups before and after the three AI fixes of 2026-10-23.'],
  machine: ['Test machine', 'The machine and browser the timed battles ran on.'],
};
const writes = [{ op: 'set', collection: 'dash', doc_id: 'meta', data: { title: 'WARFRONT AI performance' } }];
Object.entries(D).forEach(([id, [title, description]]) => {
  if (!urls[id]) throw new Error('no upload for ' + id);
  writes.push({ op: 'set', collection: 'datasets', doc_id: id, data: { title, description,
    source: { kind: 'file', url: urls[id], name: id + '.json', format: 'json' }, updated: { at, by: 'Claude' }, fixed: true } });
});
writes.push({ op: 'set', collection: 'files', doc_id: 'index.html', data: { text: fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8') } });
// Each document's body in its own file; the writes name the files.
fs.mkdirSync(path.join(outDir, 'docs'), { recursive: true });
const listed = writes.map(w => {
  const file = path.join(outDir, 'docs', w.collection + '__' + w.doc_id.replace(/\./g, '_') + '.json');
  fs.writeFileSync(file, JSON.stringify(w.data));
  return { op: w.op, collection: w.collection, doc_id: w.doc_id, file_path: file };
});
fs.writeFileSync(path.join(outDir, 'writes.json'), JSON.stringify(listed));
console.log(JSON.stringify(listed));
