#!/bin/sh
# Reinstall the omarchy plugins listed in desktop/plugins.tsv and put the
# snapshotted config files back. Run on a rebuilt machine, after omarchy itself.
#
#   PIN=1 sh scripts/desktop-restore.sh   # check out the exact recorded commits
#
# Without PIN=1 each plugin lands on its remote's default branch, which is
# usually what you want -- the pins reproduce a known-good state.
set -eu

REPO=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$REPO/scripts/desktop-lib.sh"

PLUGINS_DIR="$HOME/.config/omarchy/plugins"
LIST="$REPO/desktop/plugins.tsv"
PIN=${PIN:-0}

command -v omarchy-plugin-add >/dev/null || { echo "omarchy-plugin-add not found -- install omarchy first" >&2; exit 1; }
[ -f "$LIST" ] || { echo "missing $LIST -- run scripts/desktop-export.sh first" >&2; exit 1; }

while IFS="$(printf '\t')" read -r id remote commit; do
  case "$id" in ''|'#'*) continue ;; esac

  if [ -d "$PLUGINS_DIR/$id/.git" ]; then
    echo "  $id already installed"
  else
    echo "  installing $id from $remote"
    omarchy-plugin-add "$remote" --enable --yes
  fi

  if [ "$PIN" = 1 ] && [ -n "${commit:-}" ] && [ -d "$PLUGINS_DIR/$id/.git" ]; then
    git -C "$PLUGINS_DIR/$id" fetch --quiet origin "$commit" 2>/dev/null || true
    if git -C "$PLUGINS_DIR/$id" checkout --quiet "$commit" 2>/dev/null; then
      echo "    pinned to $commit"
    else
      echo "    could not pin to $commit -- left on default branch" >&2
    fi
  fi
done < "$LIST"

# Config files last: shell.json references plugin ids, so the plugins should
# exist first. An existing live file is kept as <name>.bak rather than lost.
for rel in $SNAPSHOT; do
  src="$REPO/desktop/$rel"
  dst="$HOME/.config/$rel"
  [ -f "$src" ] || continue
  mkdir -p "$(dirname "$dst")"
  if [ -e "$dst" ] && ! cmp -s "$src" "$dst"; then
    cp "$dst" "$dst.bak"
    echo "  kept existing $rel as $rel.bak"
  fi
  cp "$src" "$dst"
  chmod "$(mode_for "$rel")" "$dst"
  echo "  $rel restored"
done

omarchy-shell shell reloadConfig >/dev/null 2>&1 || omarchy-restart-shell >/dev/null 2>&1 || true
