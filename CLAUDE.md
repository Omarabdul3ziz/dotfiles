# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Personal dotfiles managed with **GNU Stow**. Files live here at their `$HOME`-relative paths (e.g. `.tmux.conf`, `.config/zellij/...`) and `stow` symlinks them into `~`.

## Common commands

```bash
make apply    # stow -t ~ .   (symlink everything not ignored into $HOME)
make delete   # stow -D .     (remove the symlinks)
```

`setup.sh` is an interactive installer that bootstraps tools (apt, snap, rustup, nvm, nix, go tools, group memberships) on a fresh machine. It is not idempotent for config — it only installs binaries.

## Stow ignore is the source of truth for what is "active"

`.stow-local-ignore` lists everything that **won't** be linked. Most entries are commented in (= ignored). To enable a file/dir, **comment out** its line. Currently the only active managed config is `.config/zellij`. If asked to "enable" a config (alacritty, helix, tmux, etc.), edit `.stow-local-ignore`, do not move files.

After changing what's ignored, restow: `make delete && make apply`.

## Layout

- `.config/zellij/` — actively edited. `config.kdl`, `layouts/` (per-project workspaces), `themes/`, `plugins/statusbar.wasm` (third-party WASM plugin loaded via absolute path in `config.kdl`).
- `.config/{alacritty,ghostty,helix}/` — present but ignored by stow.
- `lazyvim/` — full LazyVim distro. Symlinked into `.config/nvim` via the in-repo symlink `.config/nvim -> ../lazyvim`, so stowing `.config/nvim` is what activates it (also currently ignored).
- `.tmux.conf` — uses `M-a` as prefix (not `C-b`), Alt-based pane/window nav, TPM auto-bootstrap.
- `scripts/crafttab.sh` — defines a `crafttab` shell function that writes an ephemeral KDL layout to `/tmp` and runs `zellij action new-tab --layout`. Source pattern to follow when adding similar helpers.

## Zellij layout conventions

Layouts under `.config/zellij/layouts/` follow a consistent shape: a top-level `default_tab_template` injects the `statusbar.wasm` plugin pane, then each `tab` contains a `pane stacked=true { ... }` with one child per repo/role. **Each child pane needs its own `cwd`** — `stacked=true` belongs on the parent wrapper, not children. When adding a new project layout, copy `zos.kdl` or `default.kdl` as the template.

The statusbar plugin is loaded by absolute path (`/home/omar/.config/zellij/plugins/...`) — don't change this to a relative path; zellij's plugin loader needs the absolute form.

## Conventions

- Keep changes minimal and config-shaped — this is a dotfiles repo, not an app. No build step, no tests.
- Don't add a config under `.config/` and expect it to take effect; also uncomment it in `.stow-local-ignore`.
- The `.env` file in the repo root is intentionally tracked but only contains non-secret env shape; real secrets stay out.
