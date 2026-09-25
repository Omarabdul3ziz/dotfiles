# ADE — Agentic Development Environment

## Overview

One persistent Herdr session holds everything. Claude does the work; git review,
docs, and editing each live in a labelled tab one prefix key away. Nothing
launches a new terminal, nothing loses state on detach.

Prefix is `ctrl+space`.

| Key        | Tab     | Tool    | Role                         |
| ---------- | ------- | ------- | ---------------------------- |
| `prefix+c` | `agent` | Claude  | the agent                    |
| `prefix+g` | `git`   | LazyGit | review diffs, stage, commit  |
| `prefix+m` | `docs`  | Glow    | read markdown — plans, specs |
| `prefix+h` | `edit`  | Helix   | hand edits                   |

`prefix+g`, `prefix+m` and `prefix+h` open their tab, or refocus it if already
open — one per tool per workspace, never duplicated. `prefix+c` is the
exception: it always starts a fresh agent, so pressing it twice gives you two
Claude sessions side by side. Open a second workspace and it gets its own set.

The agent notifies when it finishes or needs you; `prefix+o` jumps to whichever
pane asked.

## Tools

- **Herdr** — session/tab/agent manager. Owns the keymap.
- **Claude Code** — the agent.
- **LazyGit** — git TUI, diffs rendered through delta.
- **Glow** — markdown reader.
- **Helix** — modal editor, and `$EDITOR`.

## Deps

```
herdr  claude  lazygit  glow  helix  delta  jq  git  python3
```

`delta` renders diffs for both git and lazygit. `jq` is required by the
`herdr-tab` helper. `python3` is required by herdr's Claude integration hook
(`~/.claude/hooks/herdr-agent-state.sh`) — without it the hook exits silently
and herdr never learns the agent's state.

```bash
for c in herdr claude lazygit glow helix delta jq git python3; do
  command -v "$c" >/dev/null || echo "missing: $c"
done
```

Or just `make ade-check`, which verifies the deps and everything below.

## Keybindings

### Herdr — motion

| Key                         | Action      |
| --------------------------- | ----------- |
| `alt+h` / `alt+l`           | tabs        |
| `alt+j` / `alt+k`           | agents      |
| `alt+shift+j` / `alt+shift+k` | spaces    |
| `alt+1..9`                  | jump to tab |

### Herdr — panes and session

| Key            | Action                       |
| -------------- | ---------------------------- |
| `alt+n`        | new tab                      |
| `alt+r`        | split right                  |
| `alt+d`        | split down                   |
| `alt+f`        | zoom pane                    |
| `alt+x`        | close pane                   |
| `prefix+arrows`| focus pane (hjkl is freed)   |
| `prefix+f`     | goto (moved off `g`)         |
| `prefix+e`     | edit scrollback in `$EDITOR` |
| `prefix+o`     | jump to whatever notified you |
| `prefix+w`     | workspace picker             |
| `prefix+shift+g` | new git worktree           |
| `prefix+shift+r` | reload config              |
| `prefix+q`     | detach                       |

`prefix+e` pipes the focused pane's scrollback into `$EDITOR` — the way to get
agent output into helix. `prefix+o` is the other half of the notification loop
below.

### Claude

| Key       | Action                                     |
| --------- | ------------------------------------------ |
| `ctrl+o`  | toggle transcript viewer (tool calls, timings) |
| `{` / `}` | jump to previous / next user prompt        |
| `esc`     | NORMAL mode (vim mode on)                  |

`{` / `}` require fullscreen rendering. Vim mode survives a `ctrl+o` toggle —
cursor and mode come back as you left them.

### LazyGit

| Key       | Action                                        |
| --------- | --------------------------------------------- |
| `}`       | widen diff context — repeat for the full file |
| `{`       | narrow diff context (default 3 lines)         |
| `space`   | stage / unstage                               |
| `c`       | commit                                        |
| `q`       | quit — closes the tab                         |

### Helix

| Key       | Action        |
| --------- | ------------- |
| `space+f` | file picker   |
| `space+/` | search project|
| `:q`      | quit          |

## Setup

### 1. `herdr-tab` — the open-or-refocus helper

Tracked at `pkg/herdr/.local/bin/herdr-tab`, linked to `~/.local/bin/herdr-tab`
by `make apply`. Herdr launches it detached, so it sets its own `PATH`.

It takes `herdr-tab [-n] <label> <command...>`: look up a tab by label in the
focused workspace, focus it if found, otherwise create it and run the command.
`-n` skips the lookup and always creates — that is what makes `prefix+c` stack
parallel agents rather than refocusing the first one.

Tab labels are unique only per workspace, so the lookup is scoped to the
focused one — an unscoped match would yank focus into another project.

### 2. Herdr — `~/.config/herdr/config.toml`

Three of the four command keys collide with herdr defaults — `prefix+c` is
`new_tab`, `prefix+g` is `goto`, `prefix+h` is `focus_pane_left` — so each is
reclaimed (to `alt+n`, `prefix+f`, and `prefix+left`) before being rebound.

`new_cwd = "follow"` is load-bearing: it is what makes `prefix+g` open lazygit
in the repo you are actually working in rather than `$HOME`.

The config itself is tracked, not duplicated here — read it at
`pkg/herdr/.config/herdr/config.toml`, which `make apply` stows to
`~/.config/herdr/config.toml`. `make ade-check` validates the live file
(`herdr config check`); a copy pasted from a doc passes nothing.

Paths in `command` must be absolute.

### 3. Claude — `~/.claude/settings.json`

Merge these keys into the existing file — do not replace it, it also carries
hooks, statusline, and plugin settings.

```json
{
  "tui": "fullscreen",
  "editorMode": "vim",
  "vimInsertModeRemaps": { "jj": "<Esc>" }
}
```

`fullscreen` is what enables `{` / `}` prompt jumping.

### 4. delta — `~/.gitconfig`

Tracked at `pkg/core/.gitconfig` (stowed to `~/.gitconfig`). `navigate = true`
is what enables `n` / `N` hunk jumping.

### 5. LazyGit — `~/.config/lazygit/config.yml`

Routes lazygit's diffs through the same delta.

Tracked at `pkg/tui/.config/lazygit/config.yml`. Routes lazygit's diffs through
the same delta.

### 6. Glow — `~/.config/glow/glow.yml`

```yaml
style: "auto"
mouse: false
pager: false
width: 80
all: false
```

### 7. Notifications — built into Herdr

No Claude-side hook is needed. Herdr detects agent state from the pane itself,
using the rules manifest it keeps at
`~/.local/state/herdr/agent-detection/status.toml` — regexes that match Claude's
spinner and prompt to `working`, `idle`, and `blocker`. When a background
workspace flips working -> idle it raises the toast and plays the done sound;
`prefix+o` jumps to whichever pane raised it.

Configured in `~/.config/herdr/config.toml`:

```toml
[ui.toast]
delivery = "terminal"   # off | herdr | terminal | system

[ui.sound]
# enabled = true
# done_path    = "sounds/done.mp3"     # finished notifications
# request_path = "sounds/request.mp3"  # needs-attention notifications
```

An earlier revision of this setup added `~/.claude/hooks/herdr-notify.sh` on the
`Stop` and `Notification` hooks, from a time when nothing told you the agent was
done. Herdr's integration has since caught up, so the hook now fires a *second*
notification on top of the built-in one. It has been removed; do not reinstate
it.

Keep herdr's own agent-state integration current — it reports the session ref so
panes can resume, but it raises no notifications of its own:

```bash
herdr integration status | grep '^claude:'   # want: current
herdr integration install claude             # if not
```

### 8. Editor — `$EDITOR`

`prefix+e` (edit scrollback) and git both open `$EDITOR`, so it should be the
same editor the `edit` tab runs:

```sh
# ~/.config/uwsm/default
export EDITOR=helix
```

Requires a re-login — it is session env, not shell env. On Omarchy this file is
managed, so an upgrade can revert it; `make ade-check` catches that.

## Sessions and remotes

The ADE lives in one persistent herdr session, `default` — bare `herdr` launches
or attaches it, `prefix+q` detaches, nothing is lost.

```bash
herdr                       # launch or attach the default session
herdr session list          # what's running
herdr --session review      # a second, independent session
herdr session attach review
herdr --remote user@host    # attach a herdr server over SSH
```

Named sessions make attach deterministic when more than one is running, and are
what `--remote` addresses. `--remote-keybindings local|server` decides whose
keymap wins; the default `local` keeps this one.

## Agents driving the environment

Herdr is scriptable over its socket, and the agent is inside it — everything the
keys do, Claude can do:

```bash
herdr --skill                          # the agent-facing skill file
herdr tab create --label test --focus
herdr agent list                       # every agent pane, with state
herdr agent read <id>                  # read another agent's output
herdr agent prompt <id> "..."          # hand it work
herdr agent wait <id> --state idle     # block until it's done
```

`herdr agent wait` plus `herdr agent read` is the primitive for one agent
supervising another. Panes carry `HERDR_ENV=1`, `HERDR_PANE_ID`,
`HERDR_TAB_ID`, and `HERDR_WORKSPACE_ID`, so a script can always locate itself —
that is how `herdr-tab` scopes its lookup.

## Agent instructions

To bring this up on a fresh machine:

1. Install the deps. Verify with the loop under **Deps** — stop if any are missing.
2. Write `~/.local/bin/herdr-tab`, then `chmod 755`. Confirm `~/.local/bin` is on `PATH`.
3. Write the config files above. Replace `/home/omar` and `$HOME` with the real
   home directory in every `keys.command` and hook command — herdr requires
   absolute paths, and Claude's hooks do not expand `$HOME`.
4. Validate herdr: `herdr config check` — must print `config: ok`. It reads
   `~/.config/herdr/config.toml`, so write there, not just into a dotfiles repo.
5. Apply: `herdr server reload-config`, or `prefix+shift+r` in a live session.
6. Test all four keys. Press twice each — the second press must refocus the
   existing tab, not open a second one. Then open a second workspace and repeat:
   the keys must act on that workspace, not jump back to the first.
7. Run `make ade-check` — it must end in `ADE: ok`.

Rules:

- Never bind over a herdr default without reclaiming it first. `prefix+c` is
  `new_tab`, `prefix+g` is `goto`, `prefix+h` is `focus_pane_left` — all three
  are reclaimed here. Check `herdr --default-config` before claiming any key.
- Never edit `~/.claude/hooks/herdr-agent-state.sh`; herdr overwrites it on
  every integration install. Add hooks beside it.
- Merge into `~/.claude/settings.json`, never overwrite it — it also holds
  hooks, statusline, permissions, and plugin settings.
- With `--no-folding`, `~/.config/herdr/` is a real directory and only
  `config.toml` inside it is a symlink into the repo. If that file is a real
  file instead, `make apply` has not run and repo edits do nothing.
- `herdr config check` validates the live file only. It passing does not mean a
  repo copy is valid.
