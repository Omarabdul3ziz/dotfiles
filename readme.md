# dotfiles ~/.*

# Tools

Theming and styling
- prefered to be consistant on all alacrity/tmux/nvim
- currently is catppuccin/mocha

App
- used every where
- settings is customizable with conf file

Terminal
- envs
- aliases
- prompt
- auto-complation

Mux
- save sessions
- windows/pans

Editor
- fast navigation
- zen mode


# Installation

these files could be used perfectly with `stow`

Install stow
```bash
apt install stow
```
Create the aliases
```bash
stow -t <home> .
```

In case you want to revert
```bash
stow -t <home> -D .
```

Note, .stow-local-ignore ignore some non dotfiles
