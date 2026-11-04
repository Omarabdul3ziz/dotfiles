---
name: digest
description: Compress something long into the decision inside it: what matters, why, what to do, what to ignore, what only I can answer. Targets a PR, issue, commit, doc, design, source tree or pasted text; bare `digest` is your own last answer, `digest session` the whole conversation. Read-only. Use for "digest this", "tl;dr", "summarize this PR/issue/doc", "what came out of this session", "/digest".
---

# digest

A filter, not a summary. Keep the decision, throw the rest away.

Target: nothing → your last answer · `session` → the whole conversation, re-read
as an artifact · a path, PR, issue or URL → that · pasted text → the paste.
Ambiguous → ask one line; otherwise act.

1. Read it properly: the diff over the prose, the decisions over the description.
2. Generated files, formatting and boilerplate → Ignore. Decisions, risks and
   load-bearing files → Matters.
3. Put in "For you" only what I alone can answer.

Output, one screen, nothing before or after:

```
Matters  1. <under twelve plain words> — file:line or link · sure|likely|guess
         (three at most; "N more below this bar")
Why      1. <what it costs, risks or unblocks: not a restatement>
Do       <one sentence, or "No action."> · read cost: 2 min | 5 min | 10+ min
Ignore   <what is noise and why it is safe to skip, or "Nothing.">
For you  <decisions or facts only I have, one line each, or "Nothing.">
```

Plain words inside the shape. A digest I cannot read is not compressed, it is
encrypted. Nothing matters → say so in one line; do not invent three. The last
answer was already a digest → say so and stop.
