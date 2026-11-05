#!/bin/bash
# Scratch: replay the idle cases in two lanes with the probe.
export WARFRONT_OUTPUT_DIR=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/idle-out
export CHROME_PATH=/opt/pw-browsers/chromium
cd /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/idle-tools
run() { local nn=$1; shift; node probe_record.cjs "$nn" "$@" > "$WARFRONT_OUTPUT_DIR/m$nn.log" 2>&1; echo "done m$nn $?" >> "$WARFRONT_OUTPUT_DIR/queue.log"; }
lane1() {
  run 04 "T.A.L.O.S Warcolossus|0"
  run 08 "Ironthunder Vanguard 1|0" "Legatus|0"
  run 15 "Michaelite Brethren 2|1" "Cantor-Preceptor|1"
  run 18 "The Blooded Hegemon|0" "Furyforged Berserkers 1|0"
  run 22 "Sepulchre Guard 1|0" "Sepulchre Guard 2|0" "Lazarite Prelate 1|0" "Lazarite Prelate 2|0"
}
lane2() {
  run 05 "Peijaiset Wardens|0" "Winter Captain|0"
  run 14 "Masque of Carnality|0"
  run 17 "Rurik the Deathless|0" "Rynda Guard|0"
  run 20 "Ironthunder Vanguard 1|1" "Caesar - Divus Imperator|1"
  run 23 "White Pole Guard|1" "Five-Banner Marshal|1"
}
lane1 &
lane2 &
wait
echo "all done" >> "$WARFRONT_OUTPUT_DIR/queue.log"
