const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<p class="kpi-label">([^<]*)<\/p>\s*<p class="kpi-vals"><span class="pa-ink">([^<]*)<\/span><span class="sep">:<\/span><span class="pb-ink">([^<]*)<\/span>/g;
let m; while ((m = re.exec(html))) console.log(`  ${m[1]}: ${m[2]} : ${m[3]}`);
