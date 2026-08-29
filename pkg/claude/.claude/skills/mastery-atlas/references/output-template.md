# Atlas output template

The structure of `~/mastery/<topic-slug>/atlas.md`. Adapt section contents to
the topic; keep the section order, the YAML header, and the ID scheme.

## Item IDs

Every actionable line gets a stable ID so a tutor skill can address it and the
learner can reference it:

* Sessions: `R<round>.S<session>` — `R2.S4`
* Items within a session: `R2.S4.a`, `R2.S4.b`
* Assessments: `R2.A`
* Resources: `[src-3]`, matching the Sources list

IDs never change once written, even if items are reordered.

## Solo or with the mentor

Most of the 100 hours happen without Claude in the room. Every item carries a
tag so Mentor knows what it is running versus what it is checking on:

* `solo` — the learner does it alone and reports back. Reading, watching,
  implementing, the project, problem sets.
* `mentor` — worth doing interactively. Retrieval warm-ups, diagnosis when
  stuck, trade-off discussion, assessments.

Assessments are always `mentor`. Expect roughly a fifth of a round's hours to
be `mentor` items; a plan where most items are `mentor` is mislabelled.

## Header

A future tutor reads this to resume without parsing prose. Keep the keys exact.

```yaml
---
topic: <full topic name>
slug: <topic-slug>
generated: YYYY-MM-DD
level_at_start: <beginner | some experience | ...>
goal: <what the learner is aiming at>
weekly_hours: <n>
hours: { round1: <sum>, round2: <sum>, round3: <sum> }
current_round: 1
status: not-started
last_studied: null
---
```

`hours` carries the real sums of each round's sessions, not the nominal
10/30/60. If a round comes in under budget the header says so.

`current_round`, `status` and `last_studied` are the only header fields
mastery-mentor may rewrite. Everything else is Atlas's.

`last_studied` lives here and nowhere else in the file.

## Skeleton

````markdown
# Progressive Spaced Mastery: <Topic>

Generated YYYY-MM-DD · <n>h/week · ~<n> weeks · verified links as of YYYY-MM-DD

## Objective

Two or three sentences. What capability this cycle buys, given the learner's
stated goal and starting level.

## What "Mastery" Means Here

Concrete and bounded. Name the level: not "expert", but e.g. "can build and
debug a production X without supervision, and read the spec when stuck."

## Prerequisites

- [ ] <thing the learner needs before Round 1>

If a prerequisite is missing and large, say how long it adds and link one
resource for it. Do not silently absorb it into Round 1.

## Knowledge Map

The concepts and their dependencies. A nested list or a mermaid graph — whichever
reads better for this topic. Mark each node CORE / DEPTH / FRONTIER.

## Safe to Skip

The single most valuable section. For each: the popular thing, and why it is not
worth the learner's 100 hours *for this goal*.

| Skipped | Why | Revisit if |
| --- | --- | --- |

## Curriculum

### Core (<n>h)
### Depth (<n>h)
### Frontier (not this cycle)
### Reference (saved, not studied)

Each entry: what it is, what it contributes, `~Xh`, and `[src-N]`.

## Resources

| # | Resource | Tier | Round | ~h | Cost | Purpose | Why this one |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| src-1 | ... | CORE | 1 | 3h | free | ... | ... |

Tier is CORE / DEPTH / FRONTIER / REFERENCE — the same taxonomy used everywhere
else in the file. Every row's URL has been fetched and verified.

## Round 1 — Map (10h)

**Goal:** "<what the learner can say at the end>"

### R1.S1 — <name> (2.5h)

- [ ] R1.S1.a — <activity> · 1h · solo · [src-1]
- [ ] R1.S1.b — <activity> · 1.5h · mentor

### R1.S2 — <name> (2h)

...

### R1.A — Assessment (1h)

<task>

**Pass:** <the explicit bar — from memory, within a time, without notes>

- [ ] Attempted
- [ ] Can explain   [ ] Can apply   [ ] Can solve unfamiliar problems

Confidence is not recorded here — it lives once, in `## Learning State`.

## Round 2 — Understand (30h)

**Goal:** "..."

### R2.S0 — Retrieval of Round 1 (1h)

Recall, do not reread. List what to recall and how it is checked.

### R2.S1 — <name> (3h)
...

### R2.A — Assessment (2h)

Application, not recall. Same pass-bar and checkbox block.

## Round 3 — Master (60h)

**Goal:** "..."

Coarse blocks, not twenty invented sessions: a real project, primary sources,
whatever Rounds 1-2 left weak, and the transfer assessment. A block may be 15h
across several sittings — say so in its header and give it checkpoints as items.

### R3.S0 — Retrieval of Rounds 1-2 (2h)

### R3.S1 — <block name> (~15h, several sittings)

- [ ] R3.S1.a — <checkpoint> · ~5h · solo
...

### R3.A — Final Assessment (4h)

A problem the learner has not seen, plus teaching the subject to someone else.

**Pass:** ...

## Spaced Review Schedule

| Concept | Session | Learned on | +1d | +1w | +3w |
| --- | --- | --- | --- | --- | --- |
| ... | R1.S2 | — | [ ] | [ ] | [ ] |

Only for concepts that matter enough to space. Six to twelve rows, not fifty.

Atlas writes Concept and Session and leaves `Learned on` as `—`. Mentor stamps
the date the concept is first taught, and ticks an interval with the date it
ran it: `[x] 2026-09-05`.

The date is what makes "overdue" computable. Without it the interval boxes say
whether retrieval happened but never whether it is late, which is the only
thing the table is for.

This is the single record of retrieval timing in the file.

## Learning State

<!-- owned by mastery-mentor -->

Atlas emits this section empty, with the comment marker. Mentor owns everything
inside it and Atlas never rewrites it.

**Current focus:** —

| Concept | Confidence | Explain | Apply | Transfer |
| --- | --- | --- | --- | --- |

**Weak:** —
**Strong:** —

**Notes:** —

## Progress

| Round | Hours | Done |
| --- | ---: | --- |
| 1 — Map | 10h | [ ] |
| 2 — Understand | 30h | [ ] |
| 3 — Master | 60h | [ ] |

## Mastery Criteria

- [ ] <concrete thing they can explain / build / solve / analyse / teach>

## Limitations of This Cycle

What 100 hours will not cover, stated plainly.

## Suggested Next 100h Cycle

Directions only — two or three paragraphs. Do not write another full curriculum.

## Sources

1. [src-1] Title — author/org — URL — verified YYYY-MM-DD
````

## Ownership

Two skills write to this file. The boundary is what keeps it from rotting.

| Region | Atlas | Mentor |
| --- | --- | --- |
| Header: `current_round`, `status`, `last_studied` | writes once | rewrites |
| Header: everything else | owns | never |
| Objective … Resources | owns | never |
| Prerequisites checkboxes | writes unticked | ticks when confirmed |
| Session and assessment definitions | owns | never |
| Item checkboxes `- [ ] R2.S4.a` | writes unticked | ticks |
| Assessment capability flags | writes unticked | ticks |
| Spaced Review Schedule | writes rows, `Learned on` as `—` | stamps dates, ticks intervals |
| `## Learning State` | emits empty | owns entirely |
| Progress table | writes | ticks round completion |

Mentor never edits curriculum. If the plan is wrong, Mentor says so and the
user decides.

Session history lives in a sibling `log.md`, never in this file.

## Rules

* Hours in every session header; round totals are the sum of their sessions.
* Every checkbox is one sitting's worth of work. If it needs a whole session,
  it is a session.
* No resource appears without an hour estimate and a verified link.
* A ticked box records that work happened. It does not record mastery — the
  assessment does.
* Every item is tagged `solo` or `mentor`.
* **Every fact has exactly one home.** `last_studied` → header. Confidence →
  the Learning State table. Retrieval timing → the Spaced Review Schedule.
  Round completion → the Progress table. Never restate one of them elsewhere;
  a second copy is a copy that goes stale, and a file that contradicts itself
  is a file the learner stops trusting.
