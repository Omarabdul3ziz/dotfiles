#!/bin/sh
# ade-check.sh -- verify the ADE is actually installed on this machine.
# Checks the live files under $HOME, not the repo copies.
fail=0
ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }
warn() { printf '  warn  %s\n' "$1"; }

echo "deps"
for c in herdr claude lazygit glow helix delta jq git python3; do
  command -v "$c" >/dev/null 2>&1 && ok "$c" || bad "$c missing"
done

echo "helper"
[ -x "$HOME/.local/bin/herdr-tab" ] && ok "herdr-tab executable" || bad "herdr-tab missing or not +x"
command -v herdr-tab >/dev/null 2>&1 && ok "herdr-tab on PATH" || bad "~/.local/bin not on PATH"

echo "herdr config"
herdr config check 2>&1 | grep -q '^config: ok' && ok "config check" || bad "herdr config check"
cfg="$HOME/.config/herdr/config.toml"
for k in prefix+c prefix+g prefix+m prefix+h; do
  grep -q "\"$k\"" "$cfg" 2>/dev/null && ok "$k bound" || bad "$k not bound in $cfg"
done
grep -q 'new_cwd' "$cfg" 2>/dev/null && ok "new_cwd pinned" || warn "new_cwd not pinned"
grep -q '^\[theme\]' "$cfg" 2>/dev/null && ok "theme pinned" || warn "theme not pinned"

echo "autostart"
# The unit is what makes the server come up on its own. Without it herdr only runs
# when something launches it by hand, and a reboot restores whatever session.json
# was last written -- which can be days stale.
systemctl --user is-enabled herdr.service >/dev/null 2>&1 \
  && ok "herdr.service enabled" || bad "run: systemctl --user enable herdr.service"
# A hand-started server works today but drifts from what the next boot will do.
if systemctl --user is-active herdr.service >/dev/null 2>&1; then
  ok "server under systemd"
elif [ -S "$HOME/.config/herdr/herdr.sock" ]; then
  warn "server running outside systemd -- the unit takes over at next boot"
else
  warn "no herdr server running"
fi

echo "notifications"
# Herdr notifies on its own from pane state; a Claude-side hook doubles it.
[ -e "$HOME/.claude/hooks/herdr-notify.sh" ] \
  && bad "herdr-notify.sh is back -- it doubles herdr's built-in notification" \
  || ok "no herdr-notify.sh"
jq -e '[.hooks.Stop[]?.hooks[]?.command, .hooks.Notification[]?.hooks[]?.command]
       | map(select(test("herdr-notify"))) | length == 0' \
  "$HOME/.claude/settings.json" >/dev/null 2>&1 \
  && ok "no duplicate notify hooks" || bad "herdr-notify wired in ~/.claude/settings.json"
grep -q '^delivery' "$cfg" 2>/dev/null && ok "toast delivery set" || warn "ui.toast.delivery unset in $cfg"
herdr integration status 2>/dev/null | grep -q '^claude: current' \
  && ok "herdr claude integration" || warn "herdr integration install claude"

echo "editor"
# helix is the prefix+h hand-edit pane; nvim is the full editor. Either is fine
# as $EDITOR -- set it in ~/.config/shell/env, which all three shells read.
case "$EDITOR" in
  *helix|*nvim) ok "EDITOR=$EDITOR" ;;
  "")           warn "EDITOR unset -- set it in ~/.config/shell/env" ;;
  *)            warn "EDITOR=$EDITOR (expected helix or nvim)" ;;
esac

echo "hooks"
# Vendor-installed, deliberately not tracked -- verify they exist instead.
[ -x "$HOME/.claude/hooks/herdr-agent-state.sh" ] \
  && ok "herdr-agent-state.sh" || bad "run: herdr integration install claude"

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
