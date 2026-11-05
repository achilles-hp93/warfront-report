// Make a minimal page carrying the AI worker block, beside a copy of the engine bundle.
const fs = require('fs');
const path = require('path');
const [bundles, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(path.join(bundles, 'warfront-engine.js'), path.join(out, 'warfront-engine.js'));
const worker = fs.readFileSync(path.join(bundles, 'ai-worker.js'), 'utf8');
fs.writeFileSync(path.join(out, 'warfront-fantasy.html'),
  '<html><body>\n<script type="text/plain" id="ai-worker-engine">\n' + worker + '\n</script>\n<script>\n</script></body></html>\n');
console.log('ok', fs.readdirSync(out));
