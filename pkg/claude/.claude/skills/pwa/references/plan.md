# /pwa plan

Output: `docs/PLAN.md` (or `docs/PLAN-N.md` for a new phase of an existing app),
status `draft`, every blocking question answered, then a short overview.
**No code.**

## 1. Understand the brief

The user's message is the brief. Check it covers:

| Essential | Example |
|---|---|
| Core promise, one line | "Open the app → know where I stand." |
| Core loop, as verbs | Work → Capture → Write → Done |
| What the user creates; required vs optional, and why | "Photo required — a memory, not evidence" |
| Who uses it (just me? family? public later?) | "Me + one shared account with my mom" |
| How often: daily / weekly / monthly | "Now and then, a monthly check" → no Today list |
| Tricky rules with edge cases | "Never skip two days in a row" |
| Feel + what to avoid | calm, journal-like; no dashboard look |
| Non-goals | no XP, no tags, no export yet |

In an existing repo, read the code and earlier plans first — preserve what
works, but don't let legacy shape the new product. If it is a rebuild, ask
whether the old thing matters at all before carrying anything over.

Also read now, so the plan fits: `~/src/omarz/homelab/CLAUDE.md` (hosting
rules), the user's global CLAUDE.md, and `references/stack.md` (default stack).

## 2. Research — in parallel, while you think

Spawn 3–5 background agents (model: haiku), each with a tight brief:
"Today is <date>. Context: <2 lines>. Answer: <numbered questions>. Cite URLs.
Under 600 words." Typical split:

1. **Inspiration** — the 5–8 best products in this space known for UX (not
   Dribbble shots). Per product: the one interaction worth stealing, how they
   handle entry, navigation, history, empty states, charts, mobile layout.
2. **Real users** — Reddit, App Store / Play reviews, HN: why people keep
   using these apps, why they abandon them, what feels rewarding vs annoying.
3. **The hard technical piece** — whatever this domain's tricky part is
   (image pipeline, offline writes, price APIs, push, sync, parsing…).
4. **Platform limits** — iOS PWA constraints relevant to this app
   (install, push, storage eviction, camera, background).
5. **Stack check** — only if the app needs something the default stack
   (`stack.md`) doesn't cover well. Don't re-research the stack for nothing.

While they run, work the parts that don't need research: entities, core
algorithm, screens. When reports land: verify every claim the plan will rely
on (curl free APIs, open the doc); record corrections in the plan.

Don't copy a product. Extract the interaction ideas and combine them.

## 3. Interview — until agreed

Ask with AskUserQuestion: ≤4 questions per round, 2–3 options each,
recommended option first with "(Recommended)", one-line trade-off per option.
Things with a sensible default go in a bulleted "Defaults I'll assume" list
instead — the user can override any of them.

Cover the forks that change the product, e.g.:
- scope of the MVP vs later; single user vs shared data
- what's required vs optional on the main entity; editing / backfilling
- offline: read-only cache, write queue, or none
- look & feel direction (offer 2–3 concrete directions with a one-line image each)
- hosting / access (tailnet only? public signup? backups?)

Keep going round by round. After each round, record answers under
**Decided (date)** at the top of the plan and update the affected sections.
Challenge an assumption if research contradicts it — say so plainly.
When the user says "simpler", actually cut: remove features, screens, stack
pieces, and re-derive the stack if the scope changed.

Every app gets a **landing page** by default (no need to ask): signed-out
visitors to `/` see a headline that says what the app is (not a slogan),
3–4 features, and one Sign in button top-right; signed-in users go straight
to the main screen. Write its copy in the plan.

## 4. Write the plan

Use `references/plan-template.md`. Concise, skimmable: tables and ASCII
mockups over prose. Phases have concrete, testable acceptance criteria —
`build` executes against them and `deploy` audits against them.

## 5. Overview — then stop

Message in chat, one screen:
- **The app in one line** + the core loop
- **How it looks** — ASCII mock of the main screen, and the visual direction
  in 3 lines (palette, type, signature element)
- **Features** — per screen, one line each; then "Not in this version"
- **Backend** — a small diagram (client ↔ PocketBase ↔ SQLite/files) and the
  entities
- **Phases** — one line each
- Anything still open

End with: "Approve and I'll `/pwa build`." Don't start building.
