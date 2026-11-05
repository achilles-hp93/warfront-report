#!/bin/bash
# usage: whatif_chain.sh <prefix> <match numbers...>  - one after another, a retry on failure
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-tools
PRE="$1"; shift
for m in "$@"; do
  for attempt in 1 2; do
    bash $T/whatif_match.sh "$PRE" "$m" > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-$PRE-m$m.log 2>&1 && break
  done
  echo "m$m: $(grep -c wrote /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aicmd-$PRE-m$m.log)"
done
