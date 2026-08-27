# Fish reads the same ~/.config/shell/{env,path,aliases} as bash and zsh.
# The parsing is hand-rolled because fish cannot source POSIX syntax.
set -l sh_dir (set -q XDG_CONFIG_HOME; and echo $XDG_CONFIG_HOME; or echo $HOME/.config)/shell

# env: KEY=value, one per line. A leading `export ` is tolerated so a
# hand-written ~/.env still loads.
for f in $sh_dir/env $HOME/.env
    test -r $f; or continue
    for line in (cat $f)
        set -l l (string trim -- (string replace -r '^\s*export\s+' '' -- $line))
        string match -qr '^(#|$)' -- $l; and continue
        set -l kv (string split -m1 = -- $l)
        test (count $kv) -eq 2; or continue
        set -gx $kv[1] (string trim -c '"\'' -- $kv[2])
    end
end

# path: prepended in order, so later lines end up earlier in $PATH.
if test -r $sh_dir/path
    for line in (cat $sh_dir/path)
        set -l d (string trim -- $line)
        string match -qr '^(#|$)' -- $d; and continue
        set d (string replace -a '$HOME' $HOME -- $d)
        test -d $d; and fish_add_path -g -m $d
    end
end

test -r $sh_dir/aliases; and source $sh_dir/aliases

if status is-interactive
    command -q zoxide; and zoxide init fish | source
end
