# Kept as a fallback -- fish is the login shell. Everything shared lives in
# ~/.config/shell/, so this file only holds zsh-specific setup.
[[ $- != *i* ]] && return

for _c in /usr/share/omarchy-zsh/conf.d/*.zsh /usr/share/omarchy-zsh/functions/*.zsh; do
  [[ -r "$_c" ]] && source "$_c"
done
unset _c

source ~/.config/shell/rc.sh

command -v zoxide >/dev/null && eval "$(zoxide init zsh)"
command -v try    >/dev/null && eval "$(try init)"
