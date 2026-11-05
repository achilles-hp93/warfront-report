#!/bin/bash
until grep -q BATCH-DONE /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-tools/batch-base.log; do sleep 10; done
/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-tools/batch.sh /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-after after $(seq 1 24) > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-tools/batch-after.log 2>&1
/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-tools/batch.sh /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-out exp 2 6 7 10 11 12 13 17 19 20 22 24 > /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-tools/batch-exp.log 2>&1
echo CHAIN-DONE >> /tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad/aimove-tools/batch-exp.log
