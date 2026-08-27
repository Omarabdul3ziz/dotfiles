# Shared bash/zsh loader. Fish reads the same three files from config.fish.
# Sourced, never executed -- keep it POSIX and side-effect free.
_sh_dir="${XDG_CONFIG_HOME:-$HOME/.config}/shell"

# env: KEY=value pairs, auto-exported. ~/.env holds the secrets and wins.
for _f in "$_sh_dir/env" "$HOME/.env"; do
  [ -r "$_f" ] && { set -a; . "$_f"; set +a; }
done

# path: skip blanks/comments, expand $HOME, never add a dir twice.
if [ -r "$_sh_dir/path" ]; then
  while IFS= read -r _d; do
    case "$_d" in ''|\#*) continue ;; esac
    eval "_d=\"$_d\""
    [ -d "$_d" ] || continue
    case ":$PATH:" in *":$_d:"*) ;; *) PATH="$_d:$PATH" ;; esac
  done < "$_sh_dir/path"
  export PATH
fi

[ -r "$_sh_dir/aliases" ] && . "$_sh_dir/aliases"
unset _sh_dir _f _d
