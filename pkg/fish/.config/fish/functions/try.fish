function try --description 'ephemeral workspace manager'
    set -l out (/usr/bin/env ruby /usr/bin/try exec --path $HOME/src/tries $argv 2>/dev/tty)
    if test $status -eq 0
        eval $out
    else
        echo $out
    end
end
