#!/bin/bash
# usage: r1_chain.sh <prefix> <match numbers...> - Round 1 only what-ifs with the worktree's code
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools
PRE="$1"; shift
for m in "$@"; do
  bash $T/spot_match.sh "$PRE" "$m" > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-$PRE-m$m.log 2>&1
  echo "m$m: $?"
done
