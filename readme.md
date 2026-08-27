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
```

The `PKGS` line in the `Makefile` is the profile — it decides what is linked.
Everything else stays tracked but dormant, which is how `herdr`, `zellij` and
`tmux` all live here while only one is active.

Shared shell config (`env`, `path`, `aliases`) lives in `pkg/shell` and is read
by bash, zsh and fish alike. Secrets stay in `~/.env`, which is gitignored;
`env.example` lists the key names.

See `CLAUDE.md` for the layout rules, `ADE.md` for the agent setup, and
`setup.md` for bootstrapping a new machine.
