#!/bin/bash
# Scratch: rerun M23 (boot timeout) and M14 (charge diagnostics) with the probe.
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/idle-out
export CHROME_PATH=/opt/pw-browsers/chromium
cd /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/idle-tools
run() { local nn=$1; shift; node probe_record.cjs "$nn" "$@" > "$WARFRONT_OUTPUT_DIR/m$nn.log" 2>&1; echo "done m$nn $?" >> "$WARFRONT_OUTPUT_DIR/queue.log"; }
run 23 "White Pole Guard|1" "Five-Banner Marshal|1"
until grep -q "done m22" "$WARFRONT_OUTPUT_DIR/queue.log"; do sleep 5; done
run 14 "Masque of Carnality|0"
echo "queue2 done" >> "$WARFRONT_OUTPUT_DIR/queue.log"
