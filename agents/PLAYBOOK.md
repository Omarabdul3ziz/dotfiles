# Playbook

What to say, shown as a few ordinary days. Works in any harness (Claude Code,
pi, dsh, opencode, codex). Plain words work too; these are the ones every
agent knows for sure.

## A Hero day (devbox)

**08:30, start.**
- `morning`: the brief: what waits on me, what moved overnight.
- `catchup`: what others changed on `development` that touches me.
- `progress`: every running item, one line each, what waits on me first.

**Answer what waits.** Each item is stopped at one of three stops:
- at **plan**: `go`, or `change: <what>`
- at **ready**: `merge`, `merge and push`, `change: <what>`, or `drop`

**Give work.**
- `work hero_db#42`: in this session, three stops.
- `work hero_db#42 straight`: skip the plan stop, it's obvious.
- `work hero_db#42, hero_router#7`: one background agent each.
- `work backlog 1-3`: the first three backlog lines.
- `review`: at ready, a second model checks it (never by default).

**Mid-task ideas: capture, don't switch.**
- `add to backlog: router should log the caller`
- `inbox: <paste a chat or call notes>`: split into backlog lines, issue
  drafts or answers; nothing is written until I say yes.
- `raise <finding>`: an issue draft, duplicate-checked, posted on yes.
- `remember the router TCP port is 9988`: one memory note, the old fact replaced.

**Something looks wrong.**
- `stack`: are my services healthy?
- `stack fix` / `stack fix ai`: rebuild and restart them (asks first).
- `what depends on hero_db`: who breaks if it changes.

**Reading someone's work.**
- `criticize hero_db#482`: verdict, what I must decide, five worst problems, what's missing.
- `tl;dr hero_db#482`: just the verdict and the decision.
- `criticize`: the same, on your own last answer.

**17:30, end of day.**
- `merge everything ready`: land every item at ready.
- `repos`: my git world: dirty repos, stale branches, open PRs, assigned issues.
- `repos clean`: clean it, item by item, on my yes.
- `catchup me`: my standup (`catchup me last week` for a period).
- `clean done agents`: Claude only; removes finished sessions.

## A PWA day (jarvis)

1. `pwa plan a tracker for my plants`: research, interview, `docs/PLAN.md` in phases.
2. `go`: approves the plan.
3. `work phase 1` (or `work phases`): builds, proves, then stops at ready.
4. `merge`: ticks the phase. Repeat for the next phase.
5. `pwa ship`: audit against the plan, deploy to the homelab, test live, URL + login.
6. Later: `pwa plan sharing with family`: writes `docs/PLAN-2.md`.

## Any repo, any machine

- `work fix the flaky login test`: a plain ask works as an item.
- `criticize src/`: harsh review, including the slop pass.
- `work fix 1,3`: fix points 1 and 3 from the last review.
- `commit`: a Conventional Commit from what is staged.
- `more`: show the working behind the last answer.
- `simpler`: it will actually cut.

## Changing the setup

- How every agent behaves → `dotfiles/agents/persona.md`
- A generic skill → `dotfiles/agents/skills/`
- Hero rules or skills → `~/hero/code/hero_brain/{rules.md,skills/}`
- PWA rules or skill → `~/src/omarz/homelab/{rules.md,skills/pwa}`
- Then `make agents` in dotfiles on that machine.
