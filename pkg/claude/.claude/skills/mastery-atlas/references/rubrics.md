# Rubrics: judging resources and writing assessments

## Judging a resource

Search ranking is not quality. Score each candidate on:

* **Authority** — does the author actually do this thing?
* **Accuracy** — checkable against a primary source?
* **Depth** — does it explain mechanism, or only describe behaviour?
* **Clarity** — can a learner at the stated level follow it?
* **Usefulness** — does it change what the learner can do?
* **Recency** — only where recency matters. A 1997 textbook can beat a 2024 blog.
* **Independence** — three articles paraphrasing the same docs are one source.
* **Cost and access** — paywalls, region locks, dead mirrors, required accounts.

Then the only question that decides inclusion:

> What specific learning need does this fill that nothing else in the plan fills?

If you cannot answer in one sentence, cut it.

### Verification checklist

- [ ] URL fetched; page exists and matches the claimed title
- [ ] Author/org is who the plan says it is
- [ ] For books: title, author, edition confirmed against a real listing
- [ ] For videos/courses: runtime matches the hour estimate
- [ ] For fast-moving topics: content is not describing a deprecated version

Anything that fails is dropped. Never keep a link "because it's probably right."

## Handling disagreement between sources

1. Name the disagreement.
2. Classify it: factual, contextual (both right, different conditions), or
   opinion.
3. Prefer primary evidence — benchmarks, specs, source code, papers.
4. If it is a live and legitimate debate, present it as one. Give the learner
   both positions and what distinguishes them. Do not flatten it.

## Writing an assessment

Bad assessments ask what the source said. Good ones ask what the learner can do.

| Level | Prompt shape |
| --- | --- |
| Recall | "List the parts of X and what each does — no notes." |
| Explain | "Explain X to a competent stranger in 10 minutes." |
| Predict | "What happens if Y? Why?" |
| Apply | "Use X to solve <problem not in any source>." |
| Diagnose | "Here is a broken Y. Find and explain the fault." |
| Compare | "X vs Z — when does each win, and why?" |
| Transfer | "<Problem from an adjacent domain.> Does X help? Show it." |
| Teach | "Write the explanation you wish you'd had in week one." |

Round 1 leans recall + explain. Round 2 leans predict + apply + diagnose.
Round 3 leans compare + transfer + teach.

### The pass bar

Every assessment states one. It must be checkable alone, and it must include a
constraint — time, no-notes, or from-memory — or it is not a bar:

> **Pass:** you sketch the request lifecycle from memory in under 15 minutes,
> naming every component, and you correctly predict what breaks when the cache
> is cold.

Weak bars to avoid: "you understand X", "you feel confident", "you finished the
course."

### Self-grading

The learner grades themselves, so give them the answer shape, not the answer:
what a good response must contain, and the two mistakes people usually make.
Put this immediately after the assessment task.

If the learner fails, the plan says where to go back to — name the session ID.
