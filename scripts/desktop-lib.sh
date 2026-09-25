# Shared by desktop-export.sh / desktop-restore.sh.
#
# SNAPSHOT lists the files under ~/.config that Omarchy SHIPS OR REWRITES but
# that you have customized. They cannot be stowed: a vendor rewrite replaces a
# symlink with a real file instead of writing through it, which has already cost
# a pair of keybindings once. So they are copied, and re-copied by
# `make desktop-export` after you change them.
#
# Files Omarchy does not ship at all (hypr/overrides.lua) belong in a stow
# package instead -- do not add them here.
#
# Deliberately NOT snapshotted:
#   omarchy/screen-time/history.json  per-app usage telemetry; this repo is public
#   omarchy/branding, extensions, hooks, themed   verified identical to vendor
#   omarchy/backgrounds/              2 MB of images; decide separately
SNAPSHOT="
omarchy/shell.json
omarchy/shell.toml
omarchy/defaults/agent
hypr/monitors.lua
"

# shell.json is mode 600 live; keep it that way when restoring.
mode_for() {
  case "$1" in
    omarchy/shell.json) echo 600 ;;
    *) echo 644 ;;
  esac
}
