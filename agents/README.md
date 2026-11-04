# agents

One agent setup for every harness (Claude Code, pi, dsh, opencode, codex), on
every machine. `make agents` (or `make apply`) builds it.

## The model

| Layer | Answers | Lives in |
|---|---|---|
| persona | how I think, decide and report | `persona.md` |
| skills | what I can ask for by name | `skills/` (work, criticize) |
| packs | what a domain needs: its rules, skills, scripts, memory | their own repo, listed in `~/.config/agents/packs` |
| adapters | the few lines only one harness understands | `adapters/<harness>.md` |

Rule of thumb: judgment goes in a prompt, anything mechanical goes in a script
a skill calls. Every fact has one home.

## What install does

1. `~/.agents/AGENTS.md` = `persona.md` + each pack's `rules.md` and `INDEX.md`.
2. `~/.claude/CLAUDE.md` = the same + `adapters/claude.md`.
3. `~/.pi/agent/AGENTS.md`, `~/.config/opencode/AGENTS.md`, `~/.codex/AGENTS.md`
   link to `~/.agents/AGENTS.md`; dsh reads it directly.
4. Each skill from `skills/` and from every pack's `skills/` is linked into
   `~/.agents/skills/` (pi, dsh, codex, opencode) and `~/.claude/skills/`.

Generated files are overwritten on every run. Edit the sources.

## Packs

A pack is a directory with any of `rules.md`, `INDEX.md`, `skills/<name>/`.
List one per line in `~/.config/agents/packs` (machine-local, not tracked):

```
~/src/omarz/homelab          # jarvis: PWA work settings, pwa
~/hero/code/hero_brain       # devbox: Hero rules, catchup, repos, stack, raise
```

## Adding things

- A rule about how I want any agent to behave → `persona.md`.
- A rule that only matters in one domain → that pack's `rules.md`.
- A repeatable task with judgment → a skill (frontmatter `name` and
  `description`, body ≤ 40 lines). Steps that never change → a script.
- Project-only knowledge → that project's own `AGENTS.md` / `CLAUDE.md`.
