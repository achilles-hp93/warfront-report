#!/bin/bash
# Probe the enemy-targeted no-damage abilities on cl-shadow3 boards (analysis only).
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
T=$S/blunders-tools
export WARFRONT_OUTPUT_DIR=$S/blunders-s3out CHROME_PATH=/opt/pw-browsers/chromium
cd /home/user/warfront/.claude/worktrees/agent-aaeeb1bec3db14d4b
run() { node $T/probe_run.cjs "$1" "$2" $S/blunders-probe/s3-m$1 1 > $S/blunders-probe/s3-m$1.log 2>&1; echo "done m$1 $?" >> $S/blunders-probe/queue.log; }
lane1() {
run 12 '{"units":[{"name":"Knight of Tehom 1","player":1},{"name":"Knight of Tehom 2","player":1}],"abilities":["Get Over Here!"]}'
run 11 '{"units":[{"name":"The Plague Monarch","player":1}],"abilities":["Benediction of Beelzebub"]}'
}
lane2() {
run 23 '{"units":[{"name":"The Dawn King","player":0}],"abilities":["Insidious Acheiropoieton"]}'
run 14 '{"units":[{"name":"The Veiled Queen","player":0}],"abilities":["Whispers of Forbidden Pleasure"]}'
}
lane1 &
lane2 &
wait
echo "all done" >> $S/blunders-probe/queue.log
