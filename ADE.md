# ADE — Agentic Development Environment

Every machine I work on runs one **herdr-core** server (`hc`): local (jarvis),
devbox and homelab. It owns the terminals; clients only show them.

```
            laptop (local)                    devbox            homelab
  ┌─────────────────────────────┐        ┌───────────┐     ┌───────────┐
  │ herdr-app  (the one client) │──ssh──▶│ hc server │     │ hc server │
  │      │                      │──ssh───┼───────────┼────▶│           │
  │      ▼                      │        └───────────┘     └───────────┘
  │ hc server  (while awake)    │              ▲                 ▲
  └─────────────────────────────┘              │                 │
              ▲                                │                 │
              └──────── Herdr phone app, ssh over Tailscale ─────┘
```

- **herdr-app** on the laptop is the only desktop client. Layout `my-terminals`:
  one space per machine, and the `machine-sidebar` mod lists each machine with every
  terminal under it, flat: the program's icon (with a state dot), then the tab's
  name if you named it, else the shell's folder or the program's title. `↳`
  marks a sub-agent (a terminal an agent started). Name each machine's dashboard
  tab `Claude Agents` (F2). Icons come from herdr-app's program table;
  `programs.json` adds the ones it lacks (`omp`).
- **The Herdr phone app** (iOS/Android) connects to each machine's `hc` over
  SSH. It only talks to herdr-core; the old herdr TUI is not supported, and is
  gone from every machine.
- **Agents started from `claude agents`** run under Claude's own daemon, not
  `hc`, so they show as the one dashboard row. Start one with `hc run claude …`
  to give it a row of its own.

## Keeping the servers up

`hc` starts its core on demand (any client — app, phone, `hc` CLI — starts it
in a transient `hc-serve-*` systemd user unit), and every terminal lives in its
own `hc-hold-*` unit, so `hc server restart` keeps programs running. What makes
that survive logout is **lingering**: without it the user's systemd manager —
and every terminal — dies with the last SSH session.

```bash
loginctl enable-linger "$USER"     # on each server, once
hc machine add <ssh-target> --install --name <name>   # from the laptop
hc machine ls                      # all of them, and their versions
```

A custom `hc.service` was tried and dropped: the on-demand core starts first and
the unit's `serve` just exits.

## Keys

| Key | Action |
| --- | --- |
| `SUPER+SHIFT+RETURN` | open or focus herdr-app |
| `SUPER+A` | the board: agents of every machine + the dispatcher line |
| `ctrl+tab` / `ctrl+shift+tab` | next / previous row in the sidebar, any program |
| `alt+up` / `alt+down` | previous / next agent |
| `ctrl+shift+t` | new tab on the shown machine |
| `ctrl+shift+b` | toggle the sidebar |
| `ctrl+shift+y` | hide or show the bot above it |

The rest live in `pkg/herdr-app/.config/herdr-app/keys.json`.

Pasting an image into a remote terminal works from herdr-app: it copies the
image to that machine and pastes its path.

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

### 1. herdr-app

Tracked in `pkg/herdr-app` (keys, the `my-terminals` layout, the `board` mod).
The sidebar mod lives in its own repo, to be published:

```bash
git clone git@github.com:Omarabdul3ziz/herdr-machine-sidebar.git ~/src/omarz/herdr-machine-sidebar
for m in machine-sidebar sidebar-bot; do ln -s ~/src/omarz/herdr-machine-sidebar/mods/$m ~/.config/herdr-app/mods/$m; done
```

After editing a mod, `herdr-app check <mod folder>` must
pass; restart the app if the change does not show.

### 2. Machines

Add each server with `hc machine add`, enable lingering there, and add the same
machine in the phone app.

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

### 7. Editor — `$EDITOR`

Git opens `$EDITOR`:

```sh
# ~/.config/uwsm/default
export EDITOR=helix
```

Requires a re-login — it is session env, not shell env. On Omarchy this file is
managed, so an upgrade can revert it; `make ade-check` catches that.

## Agents driving the environment

```bash
hc ls                                  # every terminal on every machine
hc run --bg --name x --on devbox claude "task"   # start an agent
hc read <t>                            # its screen and history
hc send <t> "..."                      # hand it work
hc wait <t>                            # block until it stops working
herdr-app --skill                      # driving the window
```

Run `make ade-check` — it must end in `ADE: ok`.
