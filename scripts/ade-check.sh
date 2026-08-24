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

echo "notifications"
[ -x "$HOME/.claude/hooks/herdr-notify.sh" ] && ok "herdr-notify.sh" || bad "herdr-notify.sh missing"
jq -e '[.hooks.Stop[]?.hooks[]?.command, .hooks.Notification[]?.hooks[]?.command]
       | map(select(test("herdr-notify"))) | length == 2' \
  "$HOME/.claude/settings.json" >/dev/null 2>&1 \
  && ok "Stop + Notification hooks wired" || bad "hooks not wired in ~/.claude/settings.json"
herdr integration status 2>/dev/null | grep -q '^claude: current' \
  && ok "herdr claude integration" || warn "herdr integration install claude"

echo "editor"
case "$EDITOR" in
  *helix) ok "EDITOR=$EDITOR" ;;
  "")     warn "EDITOR unset" ;;
  *)      warn "EDITOR=$EDITOR (ADE expects helix; re-login after changing uwsm/default)" ;;
esac

echo "stow"
if command -v stow >/dev/null 2>&1; then
  if stow -n -t "$HOME" . >/dev/null 2>&1; then ok "no conflicts"
  else warn "make apply would conflict -- run: stow --adopt -t ~ ."; fi
fi

echo
[ "$fail" -eq 0 ] && echo "ADE: ok" || echo "ADE: incomplete"
exit "$fail"
