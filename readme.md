# dotfiles

Personal configuration, managed with GNU Stow. One package per tool under
`pkg/`; each package is a `$HOME` tree, so `pkg/herdr/.config/herdr/config.toml`
lands at `~/.config/herdr/config.toml`.

```bash
make apply           # link the active packages into ~
make list            # show every package and whether it is on
make on  PKG=zellij  # activate one
make off PKG=herdr   # deactivate one
make adopt           # first run on a new machine: absorb existing ~ files, then link
make desktop-export  # snapshot omarchy plugins + customized vendor config
make desktop-restore # put them back on a new machine
```

Not everything can be a symlink. Omarchy rewrites some of its own config, and a
rewrite replaces a symlink with a real file — so the bar layout, the omarchy
plugin list and a few vendor-owned files are *copies* under `desktop/`, refreshed
with `make desktop-export`. Run it after installing a plugin or rearranging the
bar, then commit.

The `PKGS` line in the `Makefile` is the profile — it decides what is linked.
Everything else stays tracked but dormant, which is how `herdr`, `zellij` and
`tmux` all live here while only one is active.

Shared shell config (`env`, `path`, `aliases`) lives in `pkg/shell` and is read
by bash, zsh and fish alike. Secrets stay in `~/.env`, which is gitignored;
`env.example` lists the key names.

## New machine

Omarchy is the installer — there is no bootstrap script here. Install Omarchy,
then:

```bash
git clone git@github.com:Omarabdul3ziz/dotfiles.git ~/src/omarz/dotfiles
cd ~/src/omarz/dotfiles
make adopt     # absorb whatever Omarchy already put in ~, then link
git diff       # review what adopt pulled in before committing
make desktop-restore   # reinstall omarchy plugins, restore bar + vendor config
make ade-check
```

Secrets are not in the repo. Restore `~/.env` with
`make env-restore SRC=/path/env.gpg` from wherever you backed it up.

See `CLAUDE.md` for the layout rules and `ADE.md` for the agent setup.
