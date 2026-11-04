---
name: criticize
description: Harsh, honest review of any artifact (code, PR, diff, plan, design, doc, issue, idea, setup, or your own last answer). Finds what is wrong and what is missing, says what I must decide, ignores the noise. At most five points, worst first, each with a fix and how sure it is. Read-only. Use for "criticize this", "review this", "tear this apart", "what's wrong with this", "what's missing", "anti-slop", "digest this", "tl;dr", "/criticize <target>".
---

# criticize

Assume it is flawed and incomplete. Find where. No praise, no softening, no
"overall solid". A point you cannot back up is noise, so each carries how sure
it is.

Target: a path, PR, issue, URL, pasted text, or nothing (your last answer;
`session` = the whole conversation). Ambiguous → ask one line.

1. Read it properly. Never judge what you did not open; the diff over the prose.
2. What is wrong: correctness, data loss, security, edge cases, wrong
   abstractions, hidden coupling, what breaks under load or change.
3. What is missing: failure paths, tests, a step the plan skips, a question
   nobody asked, a requirement that is assumed, not stated.
4. On code, the slop pass: comments restating code, one-implementation
   interfaces, pass-through wrappers, helpers or config used once, needless
   deps or files, future-proofing. Does this complexity earn its existence?
5. Taste is a nitpick or nothing. Rank by severity; five is a cap, not a target.

Output, nothing before or after:

```
Verdict: <good | shaky | broken, in one plain sentence>
Decide:  <what only I can answer, or "nothing">
1. <problem, under ten words> — file:line · sure|likely|guess · must-fix|nice
   <what breaks or is missing>  Better: <one concrete fix>
…
N more below this bar.      (only if there were more)
Ignore:  <what looks important but is safe to skip; omit if nothing>
Unverified: <what you could not check, and why; omit if nothing>
```

"tl;dr" or "digest" → only the Verdict and Decide lines. Plain words: a review I
cannot read without knowing the jargon has failed. A short report is a
finding. Edits nothing; to fix, I say `work fix 1,3`.
