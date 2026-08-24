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

Each key opens its tab, or refocuses it if already open. One tab per tool, never
duplicates.

## Tools

- **Herdr** — session/tab/agent manager. Owns the keymap.
- **Claude Code** — the agent.
- **LazyGit** — git TUI, diffs rendered through delta.
- **Glow** — markdown reader.
- **Helix** — modal editor.

## Deps

```
herdr  claude  lazygit  glow  helix  delta  jq
```

`delta` renders diffs for both git and lazygit. `jq` is required by the
`herdr-tab` helper.

```bash
for c in herdr claude lazygit glow helix delta jq; do
  command -v "$c" >/dev/null || echo "missing: $c"
done
```

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
| `prefix+shift+r` | reload config              |
| `prefix+q`     | detach                       |

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

`~/.local/bin/herdr-tab`, mode `755`. Herdr launches it detached, so it sets its
own `PATH`.

```sh
#!/bin/sh
# herdr-tab <label> <command...>
# Open <command> in a new tab in the current workspace; reuse the tab if present.
set -e
PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export PATH

label=$1
shift
[ -n "$label" ] && [ $# -gt 0 ] || { echo "usage: herdr-tab <label> <command...>" >&2; exit 2; }

existing=$(herdr tab list 2>/dev/null \
  | jq -r --arg l "$label" '.result.tabs[]? | select(.label==$l) | .tab_id' | head -1)

if [ -n "$existing" ]; then
  herdr tab focus "$existing" >/dev/null
  exit 0
fi

pane=$(herdr tab create --label "$label" --focus | jq -r '.result.root_pane.pane_id')
herdr pane run "$pane" "$*; exit" >/dev/null
```

### 2. Herdr — `~/.config/herdr/config.toml`

`prefix+g` and `prefix+h` are taken by herdr defaults (`goto`, `focus_pane_left`),
so both are reclaimed first.

```toml
[keys]
prefix = "ctrl+space"

# One axis per unit: h/l tabs, j/k agents, shift+j/k spaces.
previous_tab       = ["alt+h", "alt+left"]
next_tab           = ["alt+l", "alt+right"]
previous_agent     = ["alt+k", "alt+up"]
next_agent         = ["alt+j", "alt+down"]
previous_workspace = ["alt+shift+k", "alt+shift+up"]
next_workspace     = ["alt+shift+j", "alt+shift+down"]
switch_tab         = "alt+1..9"

new_tab          = "alt+n"
split_vertical   = "alt+r"
split_horizontal = "alt+d"
zoom             = "alt+f"
close_pane       = "alt+x"

# Pane focus moves to the arrows; hjkl is freed for command bindings.
focus_pane_left  = "prefix+left"
focus_pane_down  = "prefix+down"
focus_pane_up    = "prefix+up"
focus_pane_right = "prefix+right"

# goto default is prefix+g, reclaimed below for lazygit.
goto = "prefix+f"

[[keys.command]]
key = "prefix+c"
type = "shell"
command = "/home/omar/.local/bin/herdr-tab agent claude"

[[keys.command]]
key = "prefix+g"
type = "shell"
command = "/home/omar/.local/bin/herdr-tab git lazygit"

[[keys.command]]
key = "prefix+m"
type = "shell"
command = "/home/omar/.local/bin/herdr-tab docs glow"

[[keys.command]]
key = "prefix+h"
type = "shell"
command = "/home/omar/.local/bin/herdr-tab edit helix"
```

Paths in `command` must be absolute.

### 3. Claude — `~/.claude/settings.json`

```json
{
  "tui": "fullscreen",
  "editorMode": "vim",
  "vimInsertModeRemaps": { "jj": "<Esc>" }
}
```

`fullscreen` is what enables `{` / `}` prompt jumping.

### 4. delta — `~/.gitconfig`

```ini
[core]
	pager = delta
[interactive]
	diffFilter = delta --color-only
[delta]
	navigate = true
	line-numbers = true
	hyperlinks = true
```

### 5. LazyGit — `~/.config/lazygit/config.yml`

Routes lazygit's diffs through the same delta.

```yaml
git:
  diffRenderers:
    - type: stdinFilter
      name: delta
      colorArg: always
      command: delta --dark --paging=never
```

### 6. Glow — `~/.config/glow/glow.yml`

```yaml
style: "auto"
mouse: false
pager: false
width: 80
all: false
```

## Agent instructions

To bring this up on a fresh machine:

1. Install the deps. Verify with the loop under **Deps** — stop if any are missing.
2. Write `~/.local/bin/herdr-tab`, then `chmod 755`. Confirm `~/.local/bin` is on `PATH`.
3. Write the five config files above. Replace `/home/omar` with the real `$HOME`
   in every `keys.command` — herdr requires absolute paths.
4. Validate herdr: `herdr config check` — must print `config: ok`. It reads
   `~/.config/herdr/config.toml`, so write there, not just into a dotfiles repo.
5. Apply: `herdr server reload-config`, or `prefix+shift+r` in a live session.
6. Test all four keys. Press twice each — the second press must refocus the
   existing tab, not open a second one.

Rules:

- Never bind over a herdr default without reclaiming it first. `prefix+g` is
  `goto`; `prefix+h` is `focus_pane_left`. Check `herdr --default-config` before
  claiming any key.
- If `~/.config/herdr` is a real directory rather than a symlink, edits to a
  dotfiles copy do nothing until copied across.
- `herdr config check` validates the live file only. It passing does not mean a
  repo copy is valid.
