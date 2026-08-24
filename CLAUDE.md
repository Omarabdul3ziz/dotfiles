# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Personal dotfiles managed with **GNU Stow**.

**`root/` is the `$HOME` tree.** Everything that gets linked into `~` lives at its
`$HOME`-relative path under `root/` — `root/.tmux.conf` → `~/.tmux.conf`,
`root/.config/zellij/` → `~/.config/zellij/`. `stow` is pointed at `root/` as its
one package, so nothing else in the repo can leak into `$HOME`.

The repo root is for the repo: docs (`ADE.md`, `readme.md`, `setup*.md`),
`Makefile`, `setup.sh`, `scripts/` (repo tooling), and `.claude/CLAUDE.md`
(project instructions). Add docs and repo files here freely — they are outside
the stow package and can never collide with a `$HOME` path.

Two pairs look like duplicates and are not:

| Repo root | `root/` |
| --- | --- |
| `.claude/CLAUDE.md` — project instructions for this repo | `root/.claude/` — the real `~/.claude` (settings, hooks, skills, statusline) |
| `scripts/ade-check.sh` — repo tooling, run by `make` | `root/scripts/` — becomes `~/scripts` |

## Common commands

```bash
make apply     # stow -t ~ root    (symlink everything not ignored into $HOME)
make delete    # stow -D -t ~ root (remove the symlinks)
make ade-check # verify the ADE is installed on this machine (see ADE.md)
```

`setup.sh` is an interactive installer that bootstraps tools (apt, snap, rustup, nvm, nix, go tools, group memberships) on a fresh machine. It is not idempotent for config — it only installs binaries.

## Stow ignore is the source of truth for what is "active"

`root/.stow-local-ignore` lists everything inside `root/` that **won't** be linked. Most entries are commented in (= ignored). To enable a file/dir, **comment out** its line. Paths in it are relative to `root/`, not the repo. If asked to "enable" a config (alacritty, helix, tmux, etc.), edit `root/.stow-local-ignore`, do not move files.

Note `.local` is currently ignored, so `root/.local/bin/herdr-tab` is tracked but never linked — the ADE's helper has to be installed by hand until that line is commented out.

After changing what's ignored, restow: `make delete && make apply`.

## Layout

- `root/.config/zellij/` — actively edited. `config.kdl`, `layouts/` (per-project workspaces), `themes/`, `plugins/statusbar.wasm` (third-party WASM plugin loaded via absolute path in `config.kdl`).
- `root/.config/{alacritty,ghostty,helix}/` — present but ignored by stow.
- `root/lazyvim/` — full LazyVim distro. Symlinked into `root/.config/nvim` via the in-repo symlink `root/.config/nvim -> ../lazyvim`, so stowing `.config/nvim` is what activates it (also currently ignored).
- `root/.tmux.conf` — uses `M-a` as prefix (not `C-b`), Alt-based pane/window nav, TPM auto-bootstrap.
- `root/scripts/crafttab.sh` — defines a `crafttab` shell function that writes an ephemeral KDL layout to `/tmp` and runs `zellij action new-tab --layout`. Source pattern to follow when adding similar helpers.

## Zellij layout conventions

Layouts under `root/.config/zellij/layouts/` follow a consistent shape: a top-level `default_tab_template` injects the `statusbar.wasm` plugin pane, then each `tab` contains a `pane stacked=true { ... }` with one child per repo/role. **Each child pane needs its own `cwd`** — `stacked=true` belongs on the parent wrapper, not children. When adding a new project layout, copy `zos.kdl` or `default.kdl` as the template.

The statusbar plugin is loaded by absolute path (`/home/omar/.config/zellij/plugins/...`) — don't change this to a relative path; zellij's plugin loader needs the absolute form.

## Conventions

- Keep changes minimal and config-shaped — this is a dotfiles repo, not an app. No build step, no tests.
- Don't add a config under `root/.config/` and expect it to take effect; also uncomment it in `root/.stow-local-ignore`.
- A new file only reaches `$HOME` if it is under `root/`. Anything else is repo-only.
- `root/.env` is intentionally tracked but only contains non-secret env shape; real secrets stay out.
