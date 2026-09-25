#!/bin/sh
# Snapshot the desktop setup into desktop/ : the omarchy shell plugins that are
# installed (id, git remote, pinned commit) and the vendor-owned config files
# you have customized. See scripts/desktop-lib.sh for what is in scope and why.
#
# Re-run after installing/removing a plugin or changing the bar, then commit.
set -eu

REPO=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$REPO/scripts/desktop-lib.sh"

PLUGINS_DIR="$HOME/.config/omarchy/plugins"
OUT="$REPO/desktop"
mkdir -p "$OUT"

for rel in $SNAPSHOT; do
  src="$HOME/.config/$rel"
  if [ ! -f "$src" ]; then
    echo "  skip $rel -- not present" >&2
    continue
  fi
  mkdir -p "$OUT/$(dirname "$rel")"
  cp "$src" "$OUT/$rel"
  chmod 644 "$OUT/$rel"
  echo "  $rel"
done

: > "$OUT/plugins.tsv"
printf '# id\tremote\tcommit\n' >> "$OUT/plugins.tsv"
[ -d "$PLUGINS_DIR" ] || { echo "  no plugins dir" >&2; exit 0; }

for dir in "$PLUGINS_DIR"/*/; do
  [ -d "$dir" ] || continue
  id=$(basename "$dir")
  if [ ! -d "$dir/.git" ]; then
    echo "  SKIP $id -- not a git checkout, nothing to restore it from" >&2
    continue
  fi
  remote=$(git -C "$dir" remote get-url origin 2>/dev/null) || {
    echo "  SKIP $id -- no origin remote" >&2
    continue
  }
  printf '%s\t%s\t%s\n' "$id" "$remote" "$(git -C "$dir" rev-parse HEAD)" >> "$OUT/plugins.tsv"
  echo "  plugin $id"
done
