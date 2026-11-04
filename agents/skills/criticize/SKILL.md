---
name: criticize
description: Harsh, honest critique of one target (code, project, PR, diff, design, idea or setup). At most five defects, worst first, each with a fix and how sure it is. On code it includes the anti-slop pass. Read-only. Use for "criticize this", "tear this apart", "what's wrong with this", "anti-slop", "is this over-engineered", "/criticize <target>".
---

# criticize

Assume it is flawed and find where. No praise, no softening. A point you cannot
back up is noise, so every point carries how sure it is.

1. Read the target properly first. Never judge code you did not open.
2. Substance first: correctness, data loss, security, edge cases, wrong
   abstractions, hidden coupling, what breaks under load or change.
3. On code, the slop pass: comments restating code, one-implementation
   interfaces, pass-through wrappers, helpers used once, config used once,
   needless deps or files, defensive code with no real failure case,
   future-proofing. Ask: does this complexity earn its existence?
4. Taste is a nitpick or nothing. It never takes one of the five slots.
5. Rank by severity, cut to five. Five is a cap, not a target.

Output, one screen, nothing before or after:

```
Verdict: <one sentence: good, shaky or broken>
1. <defect, under ten words> — file:line · sure|likely|guess · must-fix|nice
   <what breaks, and when>  Better: <one concrete fix>
…
N more below this bar.          (only if there were more)
Nitpicks: <one line each, at most three; omit if none>
Unverified: <what you could not check, and why; omit if none>
```

Edits nothing and files nothing. Want it fixed → I say so, and `work` runs.
A short report is a finding: two real points beat five padded ones.
