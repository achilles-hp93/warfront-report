#!/bin/bash
# pairs.sh mNN... : replay each battle on the base and on my build at the same time (same load).
T=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/react-tools
for m in "$@"; do
  bash $T/replay4.sh base react-pbase $m > $T/pair-base-$m.log 2>&1 &
  bash $T/replay4.sh mine react-final $m > $T/pair-final-$m.log 2>&1 &
  wait
  echo "pair $m done"
done
echo pairs-done
