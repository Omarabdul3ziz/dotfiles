```
# dotfiles

**Mentality**
portable configurations/settings for my services/dependancis.

**Usage**
$ stow -t <home> . || stow -D .

**Todo**
Be Portable as Possible
- [ ] move all neovim config in one file
- [ ] list all the services/dependancies you want in a new setup
- [ ] a way to sync services settings like gnome/browser/vscode
- [ ] init.sh script automates all installation and configurations, 
      it should have an option of what to install

Try new
- [ ] stow, chezmoi, dotbot, nixHomeManager
- [ ] usable VIM config
```

# Simple way

- `ln -s ~/github.com/Omarabdul3ziz/dotfiles/.config/zellij ~/.config/zellij`

# Stow way

- add all to ignore, uncomment only what you need
- `stow -t ~ .`
