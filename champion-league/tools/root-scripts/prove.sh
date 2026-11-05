#!/bin/bash
# prove.sh <patch.json> <exact test name>: patch the fix out of the build, run the test, put it back.
D=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad
patch="$1"; shift
python3 $D/patch_built.py "$D/$patch" || exit 1
echo "== without the fix ($patch):"
bash $D/rt.sh "$@"
python3 $D/patch_built.py "$D/$patch" --reverse
