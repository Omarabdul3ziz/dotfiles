#!/bin/sh
# ade-check.sh -- verify the ADE is actually installed on this machine.
# Checks the live files under $HOME, not the repo copies.
fail=0
ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }
warn() { printf '  warn  %s\n' "$1"; }

echo "deps"
# foot and the hyprland section only apply on the Omarchy desktop; a headless
# box (no Hyprland installed) skips them.
desktop=; command -v Hyprland >/dev/null 2>&1 && desktop=1
[ -n "$desktop" ] && deskdeps="foot herdr-app"
for c in $deskdeps fish hc claude lazygit glow helix delta jq git python3; do
  # Arch ships helix as `helix`, most other distros as `hx`.
  [ "$c" = helix ] && command -v hx >/dev/null 2>&1 && { ok "$c"; continue; }
  command -v "$c" >/dev/null 2>&1 && ok "$c" || bad "$c missing"
done

echo "herdr-core"
# One server per machine: herdr-core holds every terminal, herdr-app is the only
# client. The old herdr TUI server (herdr.service) running beside it splits the
# sessions into two lists nobody sees at once.
hc server status >/dev/null 2>&1 && ok "herdr-core running" || bad "run: hc server start"
systemctl --user is-active herdr.service >/dev/null 2>&1 \
  && bad "herdr.service is back -- run: systemctl --user disable --now herdr.service" \
  || ok "no herdr TUI server"
command -v herdr >/dev/null 2>&1 && bad "herdr TUI installed -- run: sudo pacman -Rns herdr" || ok "no herdr TUI binary"
# Without lingering the user's systemd manager, and every terminal, dies with the last login.
[ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" = yes ] \
  && ok "lingering on" || bad "run: loginctl enable-linger $USER"

echo "notifications"
# Herdr notifies on its own from pane state; a Claude-side hook doubles it.
[ -e "$HOME/.claude/hooks/herdr-notify.sh" ] \
  && bad "herdr-notify.sh is back -- it doubles herdr's built-in notification" \
  || ok "no herdr-notify.sh"
jq -e '[.hooks.Stop[]?.hooks[]?.command, .hooks.Notification[]?.hooks[]?.command]
       | map(select(test("herdr-notify"))) | length == 0' \
  "$HOME/.claude/settings.json" >/dev/null 2>&1 \
  && ok "no duplicate notify hooks" || bad "herdr-notify wired in ~/.claude/settings.json"

echo "editor"
# helix is the prefix+h hand-edit pane; nvim is the full editor. Either is fine
# as $EDITOR -- set it in ~/.config/shell/env, which all three shells read.
case "$EDITOR" in
  *helix|*nvim) ok "EDITOR=$EDITOR" ;;
  "")           warn "EDITOR unset -- set it in ~/.config/shell/env" ;;
  *)            warn "EDITOR=$EDITOR (expected helix or nvim)" ;;
esac

echo "hyprland"
if [ -z "$desktop" ]; then
  warn "Hyprland not installed -- desktop checks skipped"
else
# hyprland.lua is Omarchy's own loader, deliberately NOT tracked: an upgrade
# rewrites it, and a rewrite replaces a symlink with a real file. Only the hook
# into overrides.lua is ours, so verify the hook survived the last upgrade.
hyprmain="$HOME/.config/hypr/hyprland.lua"
if [ -f "$hyprmain" ]; then
  grep -q 'require("hypr.overrides")' "$hyprmain" \
    && ok "overrides hook in hyprland.lua" \
    || bad "hyprland.lua lost require(\"hypr.overrides\") -- re-add it, an upgrade overwrote the file"
else
  bad "$hyprmain missing"
fi
[ -L "$HOME/.config/hypr/overrides.lua" ] \
  && ok "overrides.lua stowed" || bad "overrides.lua is not a symlink -- run: make apply"
grep -q '77\.42\.4\.14' "$HOME/.config/hypr/overrides.lua" 2>/dev/null \
  && bad "a private host is hardcoded in overrides.lua -- move it to ~/.env" \
  || ok "no hardcoded remote host"
fi

echo "stow"
if command -v stow >/dev/null 2>&1; then
  pkgs=$(make -s -f "$(dirname "$0")/../Makefile" -C "$(dirname "$0")/.." print-pkgs 2>/dev/null)
  if stow -n --no-folding -d "$(dirname "$0")/../pkg" -t "$HOME" $pkgs >/dev/null 2>&1; then
    ok "no conflicts"
  else
    warn "make apply would conflict -- run: make adopt, then review git diff"
  fi
  dangling=$(find "$HOME" -maxdepth 6 -xtype l -lname "*dotfiles*" 2>/dev/null | wc -l)
  [ "$dangling" -eq 0 ] && ok "no dangling links" || bad "$dangling dangling link(s) -- run: make apply"
fi

echo
[ "$fail" -eq 0 ] && echo "ADE: ok" || echo "ADE: incomplete"
exit "$fail"
