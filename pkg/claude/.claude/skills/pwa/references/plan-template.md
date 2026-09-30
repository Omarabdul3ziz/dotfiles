# <Name>

> <core promise in one line>

Status: draft
Live: —

**Decided (<date>):**
- <every answered question, one line each — the single source of truth>

**Defaults assumed:** <things you picked without asking; user may override>

## 1. Product
- **Core loop:** <verb → verb → Done> (<N> taps)
- **Payoff:** <why they come back / look back>
- **Entities:** table — entity · fields · why it exists
- **Derived, never stored:** <totals, streaks, balances…>

## 2. UX
ASCII mockup per screen / sheet, annotated with `←`. Then:
- navigation (depth ≤ 2; secondary flows as bottom sheets)
- states table: first run · empty · loading · offline · error · <domain states>
- empty-state copy, written out word for word

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
| 0 Skeleton | app runs, sign in, empty state, installable | build + check clean; rules test: user B can't see A |
| 1 … | … | e2e at phone size; screenshots light + dark; edge table green |

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
- **Avoid:** cards, donuts, gradients, glassmorphism, row icons, emoji UI, all-caps, feature grids…
