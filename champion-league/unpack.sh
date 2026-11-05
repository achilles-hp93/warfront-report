#!/usr/bin/env bash
# Recreate the working layout the Champion League scripts expect, with the battle records
# decompressed (report.json.xz -> report.json).
#
#   ./unpack.sh <workdir> [--rs <checkout>] [--link-original-path]
#
# <workdir> then looks like the session scratchpad the scripts were written in:
#   <workdir>/cl-out/{tournaments,battle_reports,archive_day1_v1}   the official league
#   <workdir>/cl-shadow .. cl-shadow4/{tournaments,battle_reports}  check runs 1-4
#   <workdir>/cmp/                                                  digests, effects text, agg.py
#   <workdir>/<area>-tools/ ...                                     probe and measurement scripts
#   <workdir>/*.md                                                  the agent briefs
#
# --rs <checkout>   a checkout of the game repo at the build under test; symlinked as
#                   <area>/rs in every tool folder whose runner loads rs/scripts/battle_report/record.cjs
#                   (needs the repo's node_modules to be installed).
# --link-original-path
#                   many scripts hard-code the session's scratchpad path; this symlinks <workdir>
#                   there (only if that path does not exist) so they run without edits.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
src="$here/season1-day1"
work="${1:?usage: unpack.sh <workdir> [--rs <checkout>] [--link-original-path]}"
shift || true
rs=""; link=0
while [ $# -gt 0 ]; do
  case "$1" in
    --rs) rs="$2"; shift 2 ;;
    --link-original-path) link=1; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
ORIGINAL=/tmp/claude-0/-home-user/c3aa8c53-db35-52df-a72e-77d6eaa55425/scratchpad

mkdir -p "$work"
work="$(cd "$work" && pwd)"

# the runs: copy files, decompress the .xz records
(cd "$src" && find cl-out cl-shadow cl-shadow2 cl-shadow3 cl-shadow4 -type f) | while read -r f; do
  mkdir -p "$work/$(dirname "$f")"
  case "$f" in
    *.xz) xz -dc "$src/$f" > "$work/${f%.xz}" ;;
    *)    cp "$src/$f" "$work/$f" ;;
  esac
done

cp -r "$src/cmp" "$work/cmp"
for d in "$here"/tools/*/; do
  name="$(basename "$d")"
  if [ "$name" = "root-scripts" ]; then cp -r "$d". "$work/"; else cp -r "$d" "$work/$name"; fi
done
cp "$here"/briefs/*.md "$work/"

if [ -n "$rs" ]; then
  for d in "$work"/*/; do
    if grep -qs "/rs/scripts/battle_report" "$d"*.cjs "$d"*.js 2>/dev/null; then ln -sfn "$rs" "$d/rs"; echo "rs -> $(basename "$d")"; fi
  done
fi

if [ "$link" = 1 ]; then
  if [ -e "$ORIGINAL" ]; then echo "not linking: $ORIGINAL already exists" >&2
  else mkdir -p "$(dirname "$ORIGINAL")" && ln -s "$work" "$ORIGINAL" && echo "linked $ORIGINAL -> $work"; fi
fi

echo "unpacked into $work"
echo "try: python3 $work/cmp/agg.py cl-shadow3 cl-shadow4"
