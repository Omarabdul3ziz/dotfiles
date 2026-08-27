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
`env.example`. Nothing there is ever linked into `$HOME`.

## Common commands

```bash
make apply           # stow -R the PKGS list into ~   (idempotent, prunes stale links)
make delete          # unlink them
make adopt           # one-time: pull existing ~ files into the repo, then link
make on  PKG=zellij  # activate one package
make off PKG=herdr   # deactivate one package
make list            # every package, on or off
make ade-check       # verify the ADE is installed on this machine (see ADE.md)
make toggl           # reinstall the Toggl bar widget after an Omarchy update
```

`make apply` is safe to re-run. Stow refuses rather than clobbers: if a target
exists as a real file it aborts the whole run, and the fix is `make adopt`.

`--no-folding` is deliberate. Without it stow symlinks whole directories, and a
vendor-owned dir like `~/.config/omarchy/plugins/` would end up being written
into by Omarchy *through* the symlink, inside git. Per-file links cost one
`make apply` after adding a file; that is the trade.

## Only track what you actually override

Omarchy, LazyVim and herdr all ship their own config into `$HOME`. Do not track
those files. Track the override, or the script that re-applies it.

- `~/.config/hypr/*.lua` — the four files here are pure overrides (`o.bind`,
  `hl.unbind`) layered on Omarchy's defaults. Tracked.
- `~/.config/omarchy/shell.json` — Omarchy owns and rewrites it on upgrade.
  **Not tracked.** `scripts/omarchy-toggl-install.sh` jq-merges the bar entry
  back instead, so a newer Omarchy's widgets survive.
- `~/.claude/hooks/*` — installed by `herdr integration install` and the
  codebase-memory MCP. **Not tracked**; `ade-check` verifies they exist.
- `~/.config/nvim/lua/plugins/theme.lua` — an Omarchy symlink into
  `~/.local/state/omarchy/current/theme/`. **Not tracked**, recreated on theme
  switch.

When something new appears under a vendor-managed directory, ask whether it is
yours before adding it.

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
- Secrets never get committed. `.env` and `**/toggl.env` are gitignored;
  `env.example` carries key names only.
- After changing `PKGS` or adding files, run `make apply && make ade-check`.
