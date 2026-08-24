#!/bin/sh
# herdr-notify.sh <stop|attention>
# Raise a Herdr notification from a Claude hook so prefix+o jumps back to this
# pane. Kept beside herdr-agent-state.sh, which herdr owns and overwrites.
set -eu

[ "${HERDR_ENV:-}" = "1" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0

case "${1:-}" in
  stop)      title="Claude finished"; sound=done ;;
  attention) title="Claude needs you"; sound=request ;;
  *) exit 0 ;;
esac

herdr notification show "$title" --sound "$sound" >/dev/null 2>&1 || true
