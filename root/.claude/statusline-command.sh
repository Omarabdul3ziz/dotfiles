#!/bin/sh
# statusline: folder ⎇ branch · model · ctx N% · 5h N%
# Claude Code does not pass permission mode to this script, so it is not shown.

eval "$(jq -r '@sh "
cwd=\(.workspace.current_dir // .cwd // "")
name=\(.model.display_name // "")
cw=\(.context_window.context_window_size // 0)
ctx=\(.context_window.used_percentage // 0)
rl5=\(.rate_limits.five_hour.used_percentage // "")
"')"

D=$(printf '\033[90m'); R=$(printf '\033[0m')
sep=" ${D}·${R} "

# colour by fill level: green < 50, yellow < 80, red above
lvl() {
  [ "$1" -lt 50 ] && { printf '\033[32m'; return; }
  [ "$1" -lt 80 ] && { printf '\033[33m'; return; }
  printf '\033[31m'
}

# "Opus 5 (1M context)" -> "opus5·1M"
model=$(printf '%s' "$name" | sed 's/ *(.*//; s/ //g' | tr 'A-Z' 'a-z')
[ "$cw" -ge 1000000 ] 2>/dev/null && model="$model·1M"

[ -n "$cwd" ] || cwd=$PWD
if [ "$cwd" = "$HOME" ]; then folder="~"; else folder=${cwd##*/}; fi
printf "\033[36m%s\033[0m" "$folder"

branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
if [ -n "$branch" ]; then
  if [ -n "$(git -C "$cwd" --no-optional-locks status --porcelain 2>/dev/null)" ]; then
    printf " \033[31m⎇ %s\033[0m" "$branch"
  else
    printf " \033[32m⎇ %s\033[0m" "$branch"
  fi
fi

[ -n "$model" ] && printf "%s\033[35m%s\033[0m" "$sep" "$model"
[ -n "$ctx" ] && printf "%sctx %s%.0f%%\033[0m" "$sep" "$(lvl "${ctx%.*}")" "$ctx"
[ -n "$rl5" ] && printf "%s5h %s%.0f%%\033[0m" "$sep" "$(lvl "${rl5%.*}")" "$rl5"
