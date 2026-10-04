# <Name>

> <core promise in one line>

Status: draft
Live: —

**Decided (<date>):**
- <every answered question, one line each — the single source of truth>

**Defaults assumed:** <things you picked without asking; user may override>

## 1. Product
- **Core loop:** <verb → verb → Done> (<N> taps)
- **Rhythm:** <daily | weekly | monthly> — Home follows it
- **Payoff:** <why they come back / look back>
- **Entities:** table — entity · fields · why it exists
- **Derived, never stored:** <totals, streaks, balances…>

## 2. UX
ASCII mockup per screen / sheet, annotated with `←`. Then:
- navigation (depth ≤ 2; primary action in the top bar; secondary flows as
  sheets — bottom sheet on phone, centered dialog on desktop, one at a time)
- desktop layout (≥ 800px): which content goes in which of the two columns
- states table: first run · empty · loading · offline · error · <domain states>
- empty-state copy, written out word for word
- **Landing** (signed-out `/`): one screen — a headline that says what the app
  is + one line, a small static example of the main screen built from real UI
  pieces, 3–4 features (small line icon + a few words), and one line on access
  ("Private. Accounts are invited, not signed up."). Sign in = the button in the
  top bar. Copy written out here.

## 3. Research
- **Inspiration:** product → the idea we take (and what we don't)
- **What users say:** keep / abandon reasons that shaped decisions
- **Tech:** options table — option · cost · ops · verdict (chosen / why not)
- **Corrections to the research:** claims that turned out wrong

## 4. Architecture
Box diagram + repo tree (see stack.md layout). Auth, offline strategy,
the hard technical piece with concrete numbers.

## 5. Data model
Collections: fields, relations, unique indexes, API rules. Server-enforced
invariants listed explicitly.

## 6. Rules
Exact algorithm (pseudo-code) for each tricky rule + edge-case table
(case → result): empty, boundaries, month/year end, DST, timezone, future
dates, state changes. Every row becomes a unit test.

## 7. Scope
- **MVP:** one line
- **Non-goals:** list
- **Later, not never:** list (data model already allows them)

## 8. Phases
Each phase usable on its own.

| Phase | User-visible result | Acceptance (testable) |
|---|---|---|
| 0 Skeleton | app runs, landing, sign in, empty state, installable | build + check clean; rules test: user B can't see A; e2e: signed-out `/` shows landing + Sign in, 401 lands there |
| 1 … | … | e2e per feature; screenshots 390 light + dark, 900, 1440; edge table green |

- [ ] Phase 0
- [ ] Phase 1
(build ticks these)

## 9. Open questions
Only real forks: options, trade-offs, recommended default. Target: "None blocking".

## Appendix — Visual direction
- **Metaphor:** a concrete material (paper notebook, banknote, receipt…), not "clean modern"
- **Tokens** light + dark: paper, ink, ink-2, line, accent(s) with meaning
- **Type:** one characterful face + system UI; tabular numbers
- **Signature element:** the one visual thing people remember
- **Motion:** at most one animation, off under reduced-motion
- **Avoid:** cards, donut charts (one thin allocation ring is the exception), gradients, glassmorphism, row icons (landing feature icons are the exception), emoji UI, all-caps, feature grids…
