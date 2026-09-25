# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this repo is

Personal dotfiles managed with **GNU Stow**, one package per tool.

**Every directory under `pkg/` is a `$HOME` tree.** A file's path inside its
package is its path in `$HOME`: `pkg/herdr/.config/herdr/config.toml` becomes
`~/.config/herdr/config.toml`. Which packages are actually linked is the `PKGS`
line at the top of the `Makefile` — that line is the profile.

Everything under `pkg/` is tracked. Only what `PKGS` lists is linked. That is
how alternatives for the same job coexist: `zellij`, `tmux` and `herdr` are all
in the repo, only `herdr` is on.

The repo root is for the repo: docs, `Makefile`, `scripts/` (repo tooling),
`env.example`, and `desktop/` (see below). Nothing there is ever linked into
`$HOME`.

## Common commands

```bash
make apply           # stow -R the PKGS list into ~   (idempotent, prunes stale links)
make delete          # unlink them
make adopt           # one-time: pull existing ~ files into the repo, then link
make on  PKG=zellij  # activate one package
make off PKG=herdr   # deactivate one package
make list            # every package, on or off
make ade-check       # verify the ADE is installed on this machine (see ADE.md)
make desktop-export  # snapshot omarchy plugins + customized vendor config into desktop/
make desktop-restore # reinstall those plugins and restore that config
```

`make apply` is safe to re-run. Stow refuses rather than clobbers: if a target
exists as a real file it aborts the whole run, and the fix is `make adopt`.

`--no-folding` is deliberate. Without it stow symlinks whole directories, and a
vendor-owned dir like `~/.config/hypr/` would end up being written
into by Omarchy *through* the symlink, inside git. Per-file links cost one
`make apply` after adding a file; that is the trade.

## Only track what you actually override

Omarchy, LazyVim and herdr all ship their own config into `$HOME`. Do not track
those files. Track the override, or the script that re-applies it.

- `~/.config/hypr/` — only `overrides.lua` is stowed; Omarchy does not ship it
  at all. `hyprland.lua` is **not tracked** either, even though it holds our
  `require("hypr.overrides")` hook: it is Omarchy's own loader, an upgrade
  rewrites it, and a rewrite replaces the symlink with a real file rather than
  writing through it — which already ate a pair of keybindings once. `ade-check`
  asserts the hook is still there instead, so an upgrade that drops it fails
  loudly. `bindings.lua` is likewise untracked; personal binds belong in
  `overrides.lua`, loaded last and owned by nobody else.
- `~/.config/hypr/monitors.lua` and `~/.config/omarchy/{shell.json,shell.toml,
  defaults/agent}` — same problem, but these are customized, so they are
  **snapshotted by copy** into `desktop/` (below), never stowed.
- `~/.claude/hooks/*` — installed by `herdr integration install` and the
  codebase-memory MCP. **Not tracked**; `ade-check` verifies they exist.
- `~/.config/nvim/lua/plugins/theme.lua` — an Omarchy symlink into
  `~/.local/state/omarchy/current/theme/`. **Not tracked**, recreated on theme
  switch.

Private hosts and secrets never go in a tracked file — this repo is public.
`overrides.lua` reads them from `~/.env` with its own `dotenv()` helper (the
Hyprland config is parsed before any shell runs, so it cannot rely on the
environment). Add the key to `env.example`, and `ade-check` greps for known
leaks.

When something new appears under a vendor-managed directory, ask whether it is
yours before adding it.

## Two mechanisms, chosen by who owns the file

Desktop config splits by ownership, not by topic:

| Omarchy ships… | Mechanism | Example |
| --- | --- | --- |
| nothing — the file is yours | stow symlink under `pkg/` | `pkg/hypr/.config/hypr/overrides.lua` |
| and rewrites it, but you changed it | copy into `desktop/`, via `make desktop-export` | `desktop/omarchy/shell.json` |

The second row exists because a vendor rewrite destroys a symlink. `mv` and
`rename()` replace the link rather than following it — `omarchy-bar` writes
`shell.json` with `mktemp` + `mv` — so those files are copies that
`make desktop-export` refreshes. `scripts/desktop-lib.sh` holds the list and
says what is deliberately excluded (notably `omarchy/screen-time/history.json`,
which is usage telemetry — this repo is public).

Omarchy shell plugins are each their own git checkout with an origin remote;
that is what `omarchy-plugin-update` requires. `desktop/plugins.tsv` records id,
remote and pinned commit — never vendor plugin files into this repo.

## Omarchy theme integration

Four files in three packages make editors follow Omarchy's live theme. They are
one concern; change one and check the others:

- `pkg/ghostty/.config/ghostty/config` — optional include of the live theme file.
- `pkg/nvim/.config/nvim/lua/plugins/omarchy-theme-hotreload.lua` — the
  `User LazyReload` handler that swaps colorscheme without restarting nvim.
- `pkg/nvim/.config/nvim/lua/plugins/all-themes.lua` — the 11 colorschemes kept
  lazy so the hot-reload can switch to any of them.
- `pkg/nvim/.config/nvim/plugin/after/transparency.lua` — re-sourced by the
  hot-reload after each switch.

`~/.config/nvim/lua/plugins/theme.lua` is an Omarchy symlink, not ours.

## Shell config is shared across bash, zsh and fish

Fish is the login shell. `~/.config/shell/` holds the parts all three agree on:

| File | Format | Notes |
| --- | --- | --- |
| `env` | `KEY=value` | No `export`, no command substitution. Secrets go in `~/.env` (gitignored). |
| `path` | one dir per line | `$HOME` expands; missing dirs are skipped, so it is machine-portable. |
| `aliases` | `alias name=value` | This one form parses identically in all three shells. Anything needing logic belongs in a script. |
| `rc.sh` | POSIX | The bash/zsh loader. Fish parses the same three files itself in `config.fish`. |

Tool inits (`zoxide init`, `try init`) are genuinely shell-specific and stay in
each shell's own rc. `try` emits bash/zsh only, so fish gets a hand-written
`functions/try.fish`.

Adding a shared alias or PATH entry means editing one file, not three.

## Conventions

- Keep changes minimal and config-shaped — this is a dotfiles repo, not an app.
  No build step, no tests.
- A new file reaches `$HOME` only if it is inside a package listed in `PKGS`,
  and only after `make apply`.
- Secrets never get committed, encrypted or not — this repo is public. `**/.env`,
  `secrets/`, `*.gpg` and `*.age` are gitignored; `env.example` carries key
  names only. Back `~/.env` up outside the repo with
  `make env-backup DEST=...`.
- `pkg/claude/.claude/CLAUDE.md` is stowed to `~/.claude/CLAUDE.md`, so those
  rules apply to every project. There is deliberately no repo-level copy.
- This is an Omarchy (Arch) machine. There is no bootstrap installer — Omarchy
  is it. Do not reintroduce apt/snap setup scripts.
- After changing `PKGS` or adding files, run `make apply && make ade-check`.
