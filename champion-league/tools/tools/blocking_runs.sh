#!/bin/bash
# Main-thread blocking: old build (page thread), new build forced main, new build worker.
REPO=/home/user/warfront/.claude/worktrees/agent-a285210cd9fa4c5ac
S=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
P1A=iron_imperium/preset:legatus_legion
P1B=british_liberation_front/preset:merlin_army
P2A=empire_of_nihon/preset:taichou_army
P2B=principality_of_novgorod/preset:rurik_army
export CHROME_PATH=/opt/pw-browsers/chromium
cd "$REPO" || exit 1
run() {  # label outdir thread a b
  echo "=== $1"
  WARFRONT_OUTPUT_DIR="$2" timeout 900 node "$S/tools/probe_blocking.cjs" "$REPO" "$3" 1 "$4" "$5" 99 2>&1 | grep -v "^  round"
}
run "old build, pair 1" "$S/out_base" main $P1A $P1B
run "new build main, pair 1" "$S/out_new3" main $P1A $P1B
run "new build worker, pair 1" "$S/out_new3" worker $P1A $P1B
run "new build main, pair 2" "$S/out_new3" main $P2A $P2B
run "new build worker, pair 2" "$S/out_new3" worker $P2A $P2B
echo "=== done"
