#!/usr/bin/env bash
# Reinstall the Toggl Track bar widget after an Omarchy update.
#
# Omarchy leaves ~/.local/bin and ~/.config/omarchy/plugins/ alone, but it does
# force-overwrite ~/.config/omarchy/shell.json on some upgrades
# (github.com/basecamp/omarchy/issues/8357), which silently drops the bar entry.
#
# Idempotent: safe to run any time. It re-inserts only what is missing, so a
# newer Omarchy's default widgets are preserved rather than reverted.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO/root"
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

echo "Restoring Toggl widget from $REPO"

# 1. CLI
install -Dm755 "$SRC/.local/bin/omarchy-toggl" "$HOME/.local/bin/omarchy-toggl"
ok "CLI      -> ~/.local/bin/omarchy-toggl"

# 2. Plugin
mkdir -p "$HOME/.config/omarchy/plugins"
rm -rf "$HOME/.config/omarchy/plugins/omar.toggl"
cp -r "$SRC/.config/omarchy/plugins/omar.toggl" "$HOME/.config/omarchy/plugins/"
ok "Plugin   -> ~/.config/omarchy/plugins/omar.toggl"

# 3. Bar entry -- merge, never overwrite the whole file.
SHELL_JSON="$HOME/.config/omarchy/shell.json"
if [[ -f "$SHELL_JSON" ]]; then
  if jq -e '[.. | objects | select(.id? == "omar.toggl")] | length > 0' "$SHELL_JSON" >/dev/null 2>&1; then
    ok "Bar      -> omar.toggl already present in shell.json"
  else
    cp "$SHELL_JSON" "$SHELL_JSON.bak.$(date +%s)"
    tmp=$(mktemp)
    jq '.bar.layout.right = ([{id:"omar.toggl"}] + (.bar.layout.right // []))' "$SHELL_JSON" > "$tmp" && mv "$tmp" "$SHELL_JSON"
    ok "Bar      -> re-inserted omar.toggl (backup written alongside)"
  fi
else
  warn "no shell.json yet -- run 'omarchy plugin enable omar.toggl' once the shell has started"
fi

# 4. Keybindings
BIND="$HOME/.config/hypr/bindings.lua"
if [[ -f "$BIND" ]] && ! grep -q "omarchy-toggl" "$BIND"; then
  cat >> "$BIND" <<'BINDINGS'

-- Toggl Track
o.bind("SUPER + SHIFT + T", "Toggl start/stop", "omarchy-toggl toggle")
o.bind("SUPER + ALT + T", "Toggl pick entry", "omarchy-toggl pick")
BINDINGS
  ok "Keys     -> appended to bindings.lua"
else
  ok "Keys     -> already bound"
fi

# 5. The secret is deliberately NOT in git.
if [[ ! -s "$HOME/.config/omarchy/toggl.env" ]] || ! grep -q "TOGGL_API_TOKEN=." "$HOME/.config/omarchy/toggl.env" 2>/dev/null; then
  warn "API token missing. Create ~/.config/omarchy/toggl.env (chmod 600) with:"
  warn "    TOGGL_API_TOKEN=<from https://track.toggl.com/profile>"
else
  ok "Token    -> present"
fi

omarchy-shell shell rescanPlugins >/dev/null 2>&1 || true
echo "Done."
