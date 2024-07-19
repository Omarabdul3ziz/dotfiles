# dotfiles ~/.*

# Tools

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
