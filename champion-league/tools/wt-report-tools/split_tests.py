"""Move the Day 1 fix tests out of scripts/test_battle_report.cjs into
scripts/battle_report_tests/<topic>.cjs, and its shared fixtures into harness.cjs.
Cuts by line range; nothing is retyped except the require lines and paths."""
import sys, os

ROOT = sys.argv[1]
MAIN = os.path.join(ROOT, 'scripts', 'test_battle_report.cjs')
OUT = os.path.join(ROOT, 'scripts', 'battle_report_tests')
lines = open(MAIN).read().split('\n')


def find(prefix, start=0):
    for i in range(start, len(lines)):
        if lines[i].startswith(prefix):
            return i
    raise SystemExit('not found: ' + prefix)


def close(i):
    """The index of the '});' that ends the top-level call starting at i."""
    for j in range(i, len(lines)):
        if lines[j] == '});':
            return j
    raise SystemExit('no close after %d' % i)


def block(start_prefix, end_check_prefix=None):
    s = find(start_prefix)
    e = close(find(end_check_prefix, s) if end_check_prefix else s)
    return (s, e)


ranges = {
    'armies': [block("check('a unit its own side destroyed"), block("check('the armies are read as deployed")],
    'credits': [block("check('each event is sided by its unit"),
                block("// A unit for the credit recorder's pages", "check('a cost a unit")],
    'uses': [block("// page_effects.js and its parts in a page of their own", "check('what a use queued")],
    'activity': [block("check('a unit in an Objective Area"), block("check('an activity entry and a share")],
}
# The Fall Back case added inside an existing check.
fb_s = find("  // What it lost after the decision counts from the decision on")
fb_e = find("  same(fallBackRecord(report, 'test')[0].outcome.hpLost, 5,", fb_s)

# Shared fixtures: check/assert/same, card..fixture(), recorderPage().
h1_s = find('let passed = 0;')
fx = find('function fixture() {')
h1_e = next(j for j in range(fx, len(lines)) if lines[j] == '}')
h2_s = find('// page_recorder.js in a page of their own') if False else find("// page_recorder.js in a page of its own")
h2_e = close(find('function recorderPage(units, extra) {')) if False else None
# recorderPage ends at its closing '}' line.
rp = find('function recorderPage(units, extra) {')
for j in range(rp, len(lines)):
    if lines[j] == '}':
        h2_e = j
        break

take = lambda r: lines[r[0]:r[1] + 1]


def fix_paths(text):
    text = text.replace("path.join(__dirname, 'battle_report', ", 'path.join(REPORT_DIR, ')
    text = text.replace('path.join(__dirname, f)', 'path.join(SCRIPTS_DIR, f)')
    return text


os.makedirs(OUT, exist_ok=True)
harness = ["'use strict';", '',
           "// scripts/battle_report_tests/harness.cjs - what the battle report's tests share: the",
           "// check runner and its count, a recorded battle to change (fixture), and page_recorder.js",
           "// in a page of its own (recorderPage). scripts/test_battle_report.cjs runs the tests.", '',
           "const fs = require('fs');", "const path = require('path');", "const vm = require('vm');", '',
           "const SCRIPTS_DIR = path.join(__dirname, '..');",
           "const REPORT_DIR = path.join(SCRIPTS_DIR, 'battle_report');", '',
           "const results = { passed: 0, failed: 0 };"]
body = '\n'.join(take((h1_s, h1_e)))
body = body.replace('let passed = 0;\nlet failed = 0;\n', '')
body = body.replace('    passed++;', '    results.passed++;').replace('    failed++;', '    results.failed++;')
harness.append(body)
harness.append('')
harness.append(fix_paths('\n'.join(take((h2_s, h2_e)))))
harness += ['', 'module.exports = { SCRIPTS_DIR, REPORT_DIR, results, check, assert, same, card, unit, playerState, snapUnits, fixture, recorderPage };', '']
open(os.path.join(OUT, 'harness.cjs'), 'w').write('\n'.join(harness))

HEAD = {
    'credits': "// The credit ledger (page_credit.js, sides.cjs): who each HP and kill went to - a field's\n// maker, a cost's payer - and for which side, as it happened (Champion League Day 1).",
    'armies': "// Each army's units as deployed and as lost: a Round 1 requisition, a unit its own side\n// destroyed (summarize.cjs armies; Champion League Day 1).",
    'uses': "// What a use bought (page_effects.js): a table grant, and the work it queued to settle\n// later (Champion League Day 1).",
    'activity': "// What each unit did each Battle Round (page_activity.js, activity.cjs): holding an\n// objective, and the side each entry was for (Champion League Day 1).",
    'fallback': "// What followed a Fall Back decision (fallback.cjs outcome; Champion League Day 1).",
}
REQ = ("const fs = require('fs');\nconst path = require('path');\nconst vm = require('vm');\n"
       "const { SCRIPTS_DIR, REPORT_DIR, check, assert, same, unit, fixture, recorderPage } = require('./harness.cjs');\n"
       "const { summarize } = require('../battle_report/summarize.cjs');\n"
       "const { enrichCombats } = require('../battle_report/page/enrich.cjs');\n"
       "const { buildPage } = require('../battle_report/build.cjs');\n"
       "const { digest } = require('../battle_report/digest.cjs');\n"
       "const { effectsRecord } = require('../battle_report/effects.cjs');\n"
       "const { fallBackRecord } = require('../battle_report/fallback.cjs');\n"
       "const { EFFECTS_FILES } = require('../battle_report/record.cjs');\n")
NEEDS = ['fs', 'path', 'vm', 'SCRIPTS_DIR', 'REPORT_DIR', 'assert', 'unit', 'fixture', 'recorderPage', 'summarize', 'enrichCombats',
         'buildPage', 'digest', 'effectsRecord', 'fallBackRecord', 'EFFECTS_FILES']


def requires(text):
    out = []
    for line in REQ.strip().split('\n'):
        if line.startswith('const {'):
            names = [n.strip() for n in line[line.index('{') + 1:line.index('}')].split(',')]
            keep = [n for n in names if n in ('check', 'same') or n + '(' in text or n + '.' in text or n + ',' in text or n + ')' in text]
            if not keep:
                continue
            out.append('const { ' + ', '.join(keep) + ' }' + line[line.index('}') + 1:])
        else:
            name = line.split()[1]
            if name + '.' in text:
                out.append(line)
    return '\n'.join(out)


def write(topic, text):
    text = fix_paths(text)
    src = "'use strict';\n\n" + HEAD[topic] + "\n\n" + requires(text) + "\n\n" + text.strip('\n') + "\n"
    open(os.path.join(OUT, topic + '.cjs'), 'w').write(src)


for topic, rs in ranges.items():
    write(topic, '\n\n'.join('\n'.join(take(r)) for r in rs))

# The Fall Back case, as a check of its own with the entry the case needs.
fb = '\n'.join(lines[fb_s:fb_e + 1])
fb = fb.replace('  const moving = entry(1, 2, true, {});',
                "  const report = fixture();\n"
                "  report.result = Object.assign({}, report.result, { round: 9 });\n"
                "  const moving = { round: 2, uid: 1, name: 'Alpha', player: 0, fellBack: true, decision: true, plannedDest: { col: 0, row: 3 },\n"
                "    board: { hp: 5, maxHp: 5, threat: 1, engagers: [{ uid: 3, name: 'Xray', hp: 5, dealt: 1, taken: 1 }], shotAt: { stay: 0, dest: 0 },\n"
                "      killVp: { primary: 0, cards: [] }, objectives: [], opensFire: 0, terms: { stay: { screen: 0 }, dest: { screen: 0 } } } };")
write('fallback', "check('what a unit lost after its Fall Back decision counts from the decision on', () => {\n" + fb + "\n});")

# The main file without them, its fixtures from the harness.
cut = set()
for rs in ranges.values():
    for (s, e) in rs:
        cut.update(range(s, e + 2 if e + 1 < len(lines) and lines[e + 1] == '' else e + 1))
cut.update(range(fb_s, fb_e + 1))
cut.update(range(h1_s, h1_e + 2 if lines[h1_e + 1] == '' else h1_e + 1))
cut.update(range(h2_s, h2_e + 2 if lines[h2_e + 1] == '' else h2_e + 1))
kept = [l for i, l in enumerate(lines) if i not in cut]
text = '\n'.join(kept)
text = text.replace("const { digest } = require('./battle_report/digest.cjs');\n", '')
text = text.replace("const vm = require('vm');\n",
                    "const vm = require('vm');\nconst { results, check, assert, same, card, unit, playerState, snapUnits, fixture, recorderPage } = require('./battle_report_tests/harness.cjs');\n", 1)
text = text.replace('    passed++;\n    console.log(`  PASS ${name}`);', '    results.passed++;\n    console.log(`  PASS ${name}`);')
text = text.replace('    failed++;\n    console.log(`  FAIL ${name}', '    results.failed++;\n    console.log(`  FAIL ${name}')
text = text.replace("(async () => {\n",
                    "// The tests of the fixes after Champion League Day 1, a file each (battle_report_tests/).\n"
                    "console.log('[BATTLE-REPORT] credits, armies, uses, activity, Fall Backs');\n"
                    "['credits', 'armies', 'uses', 'activity', 'fallback'].forEach(f => require('./battle_report_tests/' + f + '.cjs'));\n\n"
                    "(async () => {\n", 1)
text = text.replace("  console.log(`[BATTLE-REPORT] ${passed} passed, ${failed} failed`);\n  process.exit(failed ? 1 : 0);",
                    "  console.log(`[BATTLE-REPORT] ${results.passed} passed, ${results.failed} failed`);\n  process.exit(results.failed ? 1 : 0);")
open(MAIN, 'w').write(text)
print('ok')
