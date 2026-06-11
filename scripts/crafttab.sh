# ~/.bashrc or ~/.zshrc
crafttab() {
    local name="${1:-dev}"
    local path="${2:-$(pwd)}"
    local layout_file=$(mktemp /tmp/zellij-layout-XXXX.kdl)

    cat > "$layout_file" <<EOF
layout {
    tab name="$name" {
        pane stacked=true {
            pane name="src" cwd="$path" command="nvim" args={"."}
            pane name="ai"  cwd="$path" command="claude"
            pane name="shell"  cwd="$path" 
        }
    }
}
EOF

    zellij action new-tab --layout "$layout_file"
    rm -f "$layout_file"
}
