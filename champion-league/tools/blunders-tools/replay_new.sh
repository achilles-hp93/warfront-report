#!/bin/bash
# Replay Day 1 battles on my build (wt-blunders-out) with the probe installed (analysis only).
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
T=$S/blunders-tools
OUT=${OUT:-$S/blunders-probe/new}
export REPORT_NAME=${REPORT_NAME:-blunders} WARFRONT_OUTPUT_DIR=${BUILD:-$S/wt-blunders-out} CHROME_PATH=/opt/pw-browsers/chromium
cd /home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b
mkdir -p $OUT
run() { node $T/probe_run.cjs "$1" "$2" $OUT/m$1 0 > $OUT/m$1.log 2>&1; echo "done m$1 $?" >> $OUT/queue.log; }
lane1() {
run 16 '{"units":[{"name":"Ramesses, the Eternal Pharaoh","player":0,"rounds":[1]}]}'
run 08 '{"units":[{"name":"The Chairman of the Chamber","player":1}],"abilities":["Margin Call"]}'
run 12 '{"units":[{"name":"Knight of Tehom 1","player":1},{"name":"Knight of Tehom 2","player":1}],"abilities":["Get Over Here!"]}'
run 01 '{"units":[]}'
run 11 '{"units":[{"name":"The Plague Monarch","player":1}],"abilities":["Benediction of Beelzebub"]}'
}
lane2() {
run 20 '{"units":[{"name":"Caesar - Divus Imperator","player":1,"rounds":[2,3,4,5]},{"name":"Champion of Mars","player":1,"rounds":[2]}],"abilities":["Lord of the Imperium"]}'
run 23 '{"units":[{"name":"The Dawn King","player":0}],"abilities":["Insidious Acheiropoieton"]}'
run 14 '{"units":[{"name":"The Veiled Queen","player":0}],"abilities":["Whispers of Forbidden Pleasure"]}'
run 15 '{"units":[]}'
}
lane1 &
lane2 &
wait
echo "all done" >> $OUT/queue.log
