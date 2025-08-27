# dotfiles ~/.*

- `autostart` starts > `alacrity` starts with > `tmux` restore the sessions 

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

# ideas

- try nord theme.
- 


# nvim
with stow `~/.config/nvim` link to here `.config/nvim`
which links to one of multiple setups ./current-nvim/ or ./vanilla-nvim/

---
Be Portable as Possible
- [ ] move all neovim config in one file
- [ ] list all the services/dependancies you want in a new setup
- [ ] a way to sync services settings like gnome/browser/vscode
- [ ] init.sh script automates all installation and configurations


Try new
- [ ] stow, chezmoi, dotbot, nixHomeManager
- [ ] usable VIM config
