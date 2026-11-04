---
name: work
description: Do one change (an issue, a PR, a backlog line or a plain ask) in three stops, plan, build, merge, each waiting for my word. Several items get one background agent each. `straight` skips the plan stop; pushes only on "merge and push". Use for "work on #42", "do this issue", "fix this", "start these", "/work <item>".
---

# work

One item, three stops. I decide at the stops; you do everything else.

**Settings.** A pack's rules may set these for its repos: state dir, worktree
and branch, a ground step, build, prove and pre-push commands, how to land.
Otherwise: state in `~/.local/state/agents/work/<repo>_<name>/`, a worktree at
`../<repo>_<name>` on branch `<name>` cut from the default branch, and the
repo's own build and tests.

**State.** `state.md`: `stop: plan|build|ready|merged|blocked|dropped`, item,
branch, worktree, session, and `now: <doing> · next: <step>`, rewritten at every
step. `plan.md` holds the approved plan. A stopped agent resumes from these.

**Several items** ("work A, B", "start …"): one background agent per item running
`work <item>`, if the harness can; otherwise one after another. More than three
writing at once → say so: my review is the bottleneck, not the agents.

## Stop 1 · plan
1. Ground: the item is real, mine, and not already fixed. Otherwise stop and say so.
2. Worktree and branch, per settings. Reuse one that already exists.
3. Before: reproduce it for real, with the exact command and output. Cannot →
   one line why, plus a failing test.
4. Plan in 3–5 lines: before · steps with files · risk. Two real designs →
   show both, recommend one.
5. Write `plan.md` and `state.md`, report, end the turn:
   `Stop 1 · plan · <item>` · before · plan · risk ·
   `You decide: go / change. I recommend …`
   With `straight`, skip the report and go on.

## Stop 2 · build
6. Fix in small commits, inside the plan. Anything else you notice → one `also`
   line in the report, not a fix.
7. Prove it: tests green, run it for real, rerun the before command. Not fixed →
   back to 6.
8. Only if I said "review": a different model or a fresh agent reviews (solves
   it? correct? simplest?), up to 3 rounds, fix real defects only.
9. Report, end the turn:
   `Stop 2 · ready · <item>` · changed (in behaviour, not files) · proof
   (command → output) · risk · `You decide: merge / change / drop. I recommend …`

## Stop 3 · merge (only on "merge" or "merge and push")
10. Rebase onto the base, resolve only mechanical conflicts (anything else →
    one line back to me), rebuild, retest, run the pre-push checks,
    fast-forward the base, remove the worktree and branch. Push only on
    "merge and push".
11. `state.md` → merged. One line: `merged <repo> <sha> · pushed|not pushed`.
    A lesson worth keeping → ask once: "memorize: <lesson>?"

Never commit on the base branch, widen scope, guess a conflict, push red, or
skip a stop I did not waive.
