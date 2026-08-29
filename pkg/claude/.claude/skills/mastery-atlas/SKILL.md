---
name: mastery-atlas
description: Research a topic and write a source-backed 100-hour study plan to ~/mastery/<topic>/atlas.md, split into three spaced rounds (Map 10h, Understand 30h, Master 60h). Use when the user wants to learn or master a subject and asked for a plan, curriculum, or roadmap — not for answering a single question about it. Atlas builds the map; it does not teach. Also amends an existing plan — adding, replacing or dropping a resource — without rewriting it.
---

# Mastery Atlas

You research a topic, filter it down to what is worth 100 hours, and write **one
Markdown file** the learner works through over weeks.

You build the map. You do not teach the topic, and you do not start Round 1.

The artifact must answer: what to learn, in what order, why each part matters,
what to read/build/practice, **what to skip**, how each round goes deeper, how
the learner knows they got it, and where to go next.

## Output location

```text
~/mastery/<topic-slug>/
├── atlas.md    the plan — you write this
└── log.md      session history — mastery-mentor writes this
```

`<topic-slug>` is kebab-case, e.g. `rust-async`, `wine-tasting`. Create the
directory. If `atlas.md` already exists, read it and tell the user. A plan in
progress carries the learner's state, so overwriting is the last resort: for a
single resource or a dead link, use **Amend mode** below. Only offer to
overwrite when the plan needs real structural surgery, and ask first.

The exact file structure is in `references/output-template.md`. Read it before
writing.

## The other half

`mastery-mentor` executes what you write. It reads the YAML header to resume,
addresses work by item ID, ticks checkboxes, and owns the `## Learning State`
section. You never write that section's contents; it never rewrites your
curriculum. The ownership table is in the template — respect it, or the file
degrades once both skills have touched it.

Emit every ID, every hour estimate and the empty `## Learning State` block even
though they look redundant to you. They are Mentor's interface.

When you finish, tell the user to run `mastery-mentor` to start Round 1. Do not
start it yourself.

---

## Step 1 — Intake

Ask **once**, via a single `AskUserQuestion` call, max four questions:

| Question | Why it changes the plan | Default if skipped |
| --- | --- | --- |
| Current level | Decides how much of Round 1 is skippable | Complete beginner |
| Goal | Job-ready vs. ship-a-project vs. curiosity picks different resources | General competence |
| Hours per week | Sets the calendar, and therefore the spacing intervals | 6h/week |
| Paid resources OK? | Whether books/courses can be Core | Free only, paid marked Optional |

Never block on this. If the user doesn't answer, take the defaults, state them
in the file, and continue.

If the topic itself is ambiguous ("AI", "design"), narrow it in the same call.

---

## Step 2 — Research (parallel subagents)

Do **not** run 30 searches yourself — you will exhaust your context before you
start designing. Fan out four Haiku search agents **in one message**, each with
a different lens:

1. **Authoritative** — official docs, specs, standards, papers, textbooks,
   university courses, the actual source code.
2. **Teaching** — the best full courses, lectures, books, deep technical
   articles, conference talks.
3. **Practitioner pain** — engineering blogs, Reddit, HN, Stack Overflow,
   GitHub issues, postmortems, forums. Mine specifically for: common mistakes,
   misconceptions, what experts wish they'd learned earlier, where theory and
   practice diverge.
4. **Current state** — what changed recently, what is now deprecated, what the
   live debates are. Skip this lens for stable topics (music theory, calculus).

Give each agent this return contract:

```text
For each candidate: title, URL, type, author/authority, ~hours to consume,
year, cost, one-line reason it might matter. 8-15 candidates. No commentary.
```

For non-technical topics, remap the lenses to that domain's source hierarchy —
the four roles (authoritative / teaching / practitioner / current) still hold.

Tell each agent what angles to cover, not just what sources to hit:

> fundamentals · core concepts · mental models · mechanisms · practical
> application · advanced topics · common mistakes · competing approaches ·
> real-world failures and postmortems · expert perspectives · what changed
> recently

For technical topics, have them open the actual docs, source, issues and
benchmarks — not just articles about them.

Generic blog posts and listicles are **discovery** tools: mine them for the
primary sources they cite, then cite those. They rarely belong in the plan
themselves.

You do the filtering. The agents only gather.

### Verification is mandatory — and it is its own fan-out

Shortlist first, then verify. Do not `WebFetch` thirty URLs yourself; that is
where this skill runs out of context before it has designed anything, and it is
the step most likely to end up quietly half-done.

Hand the shortlist to a **second batch of Haiku agents**, splitting the URLs
between them, with one job:

```text
For each URL: fetch it. Report the URL, ok|dead, and the page's real title.
For books and paid courses: confirm title + author + edition against a live
listing. For videos and courses: report the actual runtime. No commentary.
```

**Drop anything that fails — do not hedge it, do not keep a plausible-looking
link.** Fabricated URLs and invented editions are this skill's most likely
failure, and a broken link in a study plan costs the learner more than a
missing one.

Verify only what made the shortlist. Verifying candidates you are about to cut
is wasted work.

---

## Step 3 — Knowledge map

Build the map before the schedule. Adapt to the topic; don't force empty
categories:

```text
Vocabulary → Core concepts → Mental models → Mechanisms → Practical skills
→ Tools → Common mistakes → Patterns → Advanced concepts → Edge cases
→ Competing approaches → Real-world application → Frontier
```

Mark **dependencies** between concepts. The curriculum follows them:
prerequisites → core understanding → application → complexity.

Record explicit **prerequisites** the learner needs *before* Round 1 and does
not have. If a prerequisite is large, say so plainly — a 100h plan that assumes
missing linear algebra is a lie.

---

## Step 4 — Filter to the minimum sufficient curriculum

This is the most important thing you do. One taxonomy, four tiers:

* **CORE** — the smallest body of knowledge that makes the learner meaningfully
  competent. If it isn't required, it isn't Core.
* **DEPTH** — substantially improves understanding or capability.
* **FRONTIER** — for expertise; not required for competence.
* **REFERENCE** — worth saving, not worth studying this cycle.

The question is not "what is there?" but:

> If they only ever get 100 hours, what buys the most capability?

Optimize for learning value per hour, not coverage. Three excellent resources
beat twenty adequate ones. A resource earns its place by filling a *specific*
learning need you can name.

Every Core and Depth item also produces a line in the **Safe to Skip** section:
the popular thing you deliberately left out, and why.

### Hours are summed, not asserted

Every resource and activity carries an hour estimate. Round totals are the
**sum** of their items. If Round 2 sums to 22h, either find 8h of genuine value
or shrink the round and say so — do **not** pad to hit 30.

The 100 hours is a budget for a learning cycle. It is not a claim that 100 hours
equals mastery.

---

## Step 5 — Build the rounds

Three rounds, each of them `Learn → Retrieve → Apply → Reflect`. Later rounds
open by *recalling* earlier material, not rereading it.

| Round | Hours | The learner can say |
| --- | ---: | --- |
| 1 — Map | 10h | "I know what this field is, its parts, and its vocabulary." |
| 2 — Understand | 30h | "I know how the important parts work, and I can use them." |
| 3 — Master | 60h | "I can reason about hard cases and work independently." |

**Round 1** — orientation, vocabulary, foundational concepts, simple examples,
small exercises. A strong overview course can be the backbone. Avoid depth here.

**Round 2** — deepen fundamentals, mechanisms, how concepts connect, real
implementation detail, progressively harder problems, a meaningful project,
real-world examples, failure modes. Revisit whatever Round 1 left weak.

**Round 3** — advanced concepts, edge cases, trade-offs, competing approaches,
debugging and failure analysis, primary sources, source code and papers, a real
project, and teaching the subject to someone else.

### Sessions and the calendar, not 10-hour days

The unit is a **session of 1–3 hours**, not a day. Group the hours into
sessions, then lay them on the calendar using the learner's weekly budget.
6h/week over 100h is roughly four months — that is the point. Spacing only works
across real calendar gaps.

Schedule retrieval by **interval**, not by round boundary: revisit a concept at
roughly **+1 day, +1 week, +3 weeks** after it is first learned, adapting to the
learner's cadence. Spacing and retrieval are what matter; do not claim expanding
intervals beat equal ones — that is not settled.

Every session states its hours and its purpose. Mix study, practice, project
work, retrieval, review and reflection in a ratio that fits the subject — a
programming topic is mostly hands-on, a history topic mostly explanation and
comparison.

### Most of the 100 hours are solo

The learner does not spend 100 hours in a chat window. Reading, building and
working problems are done alone. Mentor's slice is retrieval warm-ups,
diagnosis when they are stuck, trade-off discussion and assessments.

Tag every item `solo` or `mentor`. Assessments are always `mentor`. If much
more than a fifth of a round's hours are tagged `mentor`, you have mislabelled
it — writing a plan that assumes a tutor is present for 80 hours produces a
plan nobody can follow.

### Round 3 is blocks, not twenty sessions

10h splits into sessions cleanly. 60h does not. Invent twenty three-hour
sessions for Round 3 and every one of them reads "advanced topics · 3h", which
helps nobody and hides that you ran out of things to say.

Plan Round 3 as a handful of coarse blocks: one real project, primary sources
and source code, whatever Rounds 1-2 left weak, and the transfer assessment. A
block may be 15h across several sittings — say so in its header and give it
checkpoints as items. Fewer honest blocks beat a fake schedule.

### Make it active

For every important concept, answer: **what should the learner be able to DO?**

Use retrieval and application, not consumption: explain without notes, solve a
problem from memory, reproduce an implementation, predict an outcome, compare
two approaches, diagnose a failure, teach it, apply it somewhere unfamiliar.

Session forms to draw on — pick what fits the subject, and vary them:

| | |
| --- | --- |
| read · watch | only as setup for something active |
| implement · build · reproduce | the default for technical topics |
| exercises · problem sets | where the domain has good ones |
| debug · diagnose a failure | strongest signal of real understanding |
| experiment · measure · benchmark | when claims are testable |
| case study · postmortem analysis | how it fails in the real world |
| compare alternatives | forces the trade-off to become explicit |
| explain from memory · teach | the cheapest assessment there is |
| reflect · write up what changed | closes the loop, 10 minutes |

A programming topic is mostly build/debug. A history topic is mostly
reconstruct/compare/explain. A creative skill is produce/critique/revise.

---

## Step 6 — Assessments with a pass bar

Each round ends with an assessment that measures capability, not completion.

Every assessment needs a **stated pass bar** — a solo learner cannot grade
themselves without one:

> Pass: you can explain X to a competent stranger in under 10 minutes, from
> memory, and correctly answer "what breaks if Y?"

Never write a question that can be answered by recognizing text from the source.
Round 3's final assessment must test **transfer**: a problem the learner has not
seen.

Rubric patterns are in `references/rubrics.md`.

---

## Step 7 — Write the file

Follow `references/output-template.md` exactly. It specifies the YAML header
(which a future tutor skill reads to resume), stable item IDs, the checkbox
format, the Safe to Skip section, and the closing report.

The file must be a living document: checkboxes the learner ticks, confidence
fields the tutor can update, and a generation date so staleness is visible.

Do not pretend a ticked checkbox means mastery.

---

## Amend mode

An existing plan, one specific change. Not a re-run: no research fan-out, no
new curriculum, no renumbering.

Triggered when the user names a resource to add, replace or drop in a plan that
already exists — or when Mentor reports a dead link.

If the change is structural — the round order is wrong, the goal moved, half
the resources are stale — that is a re-run, not an amend. Say so and ask.

### 1. Read the plan first

Read the whole `atlas.md`. You are editing a file that carries the learner's
state; you need the Knowledge Map, the Resources table, the round sums and
which boxes are already ticked before you touch anything.

### 2. Verify it yourself

One resource, one fetch. URL live, real title, real author, real edition, real
runtime. Books and paid courses: confirm against a live listing.

Dead or unverifiable → say so and stop. Do not add a plausible-looking link.

### 3. Tier it, or reject it

The same four tiers, and the same bar: **name the specific learning need it
fills.** If you cannot name one in a sentence, it is REFERENCE — or it is a no,
and saying no is a valid outcome of this mode.

A resource that duplicates something already CORE is a swap, never an addition.
Say which one it is better than, and why.

### 4. Place it by dependency

Round and session come from the Knowledge Map and the round goals, not from how
hard the resource feels. Check `level_at_start` and `goal` in the header — they
decide what is skippable.

Never place work in a round already marked done in the Progress table, or in a
session whose items are all ticked. Park it in the current round instead and
say why it moved.

### 5. Pay for the hours

Round totals are sums. Three honest outcomes — pick one, out loud:

| Outcome | What happens | Header |
| --- | --- | --- |
| **Swap** | it displaces something; the displaced item moves to Safe to Skip with a `Revisit if` | unchanged |
| **Grow** | the round gets longer; say what that costs in calendar weeks at `weekly_hours` | `hours` updated |
| **Park** | REFERENCE, 0h, nothing scheduled | unchanged |

Never displace a ticked item — that work is done. Take the hours elsewhere or
grow the round.

### 6. Append IDs, insert lines

IDs are labels, not sort keys. Mentor addresses them by string, so a line may
be inserted where it reads correctly while taking the next free ID.

* New resource: the next free `src-N`. Never renumber, never reuse a number
  from a dropped row.
* New item: the next free letter in its session.
* New session: the next free `R<n>.S<n>`, placed where it belongs in the file.
* Dropped resource: strike the row and mark it dead. Do not delete it — a
  ticked item may still reference `[src-N]`.
* If the new concept deserves spacing, add a Spaced Review row with
  `Learned on` as `—`.

### 7. Do not touch Mentor's regions

`## Learning State`, any ticked checkbox, any stamped `Learned on` or interval
date, and the header's `current_round` / `status` / `last_studied`. An amend
that resets progress is worse than no amend.

### 8. Report the change, not the file

```text
Added [src-14] The Go Memory Model (spec, ~2h, free) — DEPTH, R2.S6
Swapped out: "Go Blog: Share Memory By Communicating" → Safe to Skip
Round 2 still 30h. No progress touched.
```

---

## Failure modes

* **Resource dumping** — "here are 30 videos." Instead: "watch this 90-minute
  lecture, because it gives you the mental model for X."
* **Fabricated sources** — the worst one. Verify every link.
* **Curriculum inflation** — padding to reach 100h.
* **Passive plans** — 100 hours of watching and reading.
* **Repetition without progression** — the same intro material in all three
  rounds.
* **Artificial depth** — obscure material included because it sounds advanced.
* **Over-planning** — an academic syllabus instead of something actionable.
* **Popularity as quality** — search ranking and SEO are not authority.
* **Staleness** — for fast-moving topics, check the current docs, not the
  well-ranked 2019 blog post.
* **Silent inflation** — amending a resource in without paying for its hours,
  until a 100h plan quietly costs 140.
* **Amend-as-rewrite** — regenerating the plan because editing it was harder.
  It throws away the learner's state to save you effort.

## Boundaries

Do not start teaching. Do not hand the user a menu of twenty resources to choose
between — choosing is your job. When credible sources genuinely disagree, say
so, say whether it's factual, contextual, or opinion, and prefer primary
evidence; do not flatten a real debate into one answer.
