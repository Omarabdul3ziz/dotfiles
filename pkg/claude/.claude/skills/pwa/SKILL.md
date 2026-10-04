---
name: pwa
description: Framework for making a small, calm, installable PWA end to end, in three commands. `/pwa plan <idea>` researches the domain and competitors online, interviews the user until every fork is decided, and writes docs/PLAN.md. `/pwa build` implements the approved plan without stopping until everything is built and tested. `/pwa deploy` (alias `verify`) checks the build against the plan, deploys to the homelab, tests it live and hands over access. Use when the user runs /pwa, or wants to plan, build or ship a new web app / PWA. Also for a new phase or big feature of an app that was made this way (writes docs/PLAN-N.md).
---

# /pwa — plan → build → deploy

One product, three gates. Each gate ends with the user, never with you guessing.

```
/pwa plan <idea>   research + interview → docs/PLAN.md → overview → STOP
/pwa build         only on an approved plan → everything built + tested → STOP
/pwa deploy        plan-vs-built audit → homelab → tested live → URL + access
```

No argument: read `docs/PLAN*.md` and say which step is next.
`verify` is an alias of `deploy`.

Read the matching reference before acting:

| Step | Reference |
|---|---|
| plan | `references/plan.md` (+ `references/plan-template.md`) |
| build | `references/build.md` + `references/stack.md` |
| deploy | `references/deploy.md` |

## Principles (all steps)

- **Does it strengthen the core loop?** If not, it's a non-goal. Small products,
  fewer concepts, fewer taps. The user should understand the app in 10 seconds.
- **Plan is the contract.** Nothing is built that isn't in the approved plan.
  New scope mid-build → stop, append to the plan, ask, then continue.
- **Derive, don't store.** Balances, streaks, totals, alerts are computed from
  raw rows. The server only enforces invariants (ownership, uniqueness, validation).
- **Calm, not SaaS.** No dashboards, stat cards, badges, gradients, icon grids,
  modal hell. One primary action per screen, sheets over pages, undo over confirm.
- **Fit the rhythm.** Ask how often the app is used (daily / weekly / monthly);
  an occasional app gets no "Today" list, streaks or daily nudges.
- **Real data is sacred.** Imports dry-run first and apply only on the user's
  go; migrations are tested on a copy of live data; live tests never write to
  real users.
- **Verify by using it.** "Compiles" is not done. Open it, look at screenshots,
  break the network, test against the real deployed instance.
- **Check research.** Cheap research agents get numbers, limits and prices
  wrong. Verify what the plan relies on (curl the API, read the doc) and list
  the corrections in the plan.
- **Ask only real forks.** Anything with a conventional default: pick it,
  state it, move on.
- **Parallelize** with background agents (Haiku for web search). Keep UI and
  integration in the main agent so it stays coherent.
- **Status out loud.** If the user asks something mid-build, answer in one line
  and keep working — answering must not end the run.
- **Never commit or push unless asked.** New repos default to private.

## Preferences (Omar)

- KISS: the simple version first, few comments, no clever abstractions.
- Subagents for parallel work (Haiku for web search); UI stays in the main agent.
- Never commit or push unless asked.
- App login for every PWA: omarabdul3ziz@gmail.com (superuser admin@<app>.local); logins live only in Vaultwarden, folder HomeLab.
- Desktop is a real layout from day one (two columns ≥ 800px), not a phone strip.
- Primary action (Add) in the top bar; wordmark links home; one Sign in, top-right.
- Small line icons only on the landing feature row. One allocation ring is the
  only donut-style chart allowed (thin, swatches on the rows, no hover).
- Recurring misses to check before calling a phase done: landing added late,
  desktop added late, plan drifting from the code, homepage `PWA` group
  missing, Lighthouse not run.

## Plan state

`docs/PLAN.md` carries the state in its header — every step reads it first:

```
Status: draft | approved <date> | built <date> | deployed <date> — <url>
```

`build` refuses unless status is `approved`. The user approving in chat
("go", "start", "looks good, build it") is what flips it — write the line, then build.

Plans are history: never delete `docs/PLAN*.md`. After each deploy, add or
refresh `CLAUDE.md` (what the app is, commands, rules, traps, preferences) and
`docs/adr/NNNN-<slug>.md` (one per decision, from the **Decided** lines), and
give the finished plan a one-line "Done — see CLAUDE.md / ADRs" status.
