```
# dotfiles

**Mentality**
portable configurations/settings for my services/dependancis.

**Usage**
$ make apply || make delete

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

# Layout

Everything under `root/` is the `$HOME` tree — `root/.config/herdr/config.toml`
becomes `~/.config/herdr/config.toml`. The repo root holds docs, `Makefile`, and
`scripts/`, none of which are ever linked out.

```
make apply    # stow -t ~ root
make delete   # stow -D -t ~ root
make ade-check
```

`root/.stow-local-ignore` lists what inside `root/` stays unlinked; comment a
line out to activate it.
