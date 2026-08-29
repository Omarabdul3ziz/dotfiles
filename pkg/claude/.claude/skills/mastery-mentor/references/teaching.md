# Teaching reference

## Questioning

The point of a question is to locate the edge of what the learner knows, then
teach exactly there. A question that only checks vocabulary tells you nothing.

| Weak | Strong |
| --- | --- |
| "What is leader election?" | "Why does this fail if the leader crashes right after acknowledging the entry?" |
| "What does `pin` do?" | "Here's a struct that moved. Show me where it broke." |
| "Define ClusterIP." | "Traffic reaches the pod but not the service. Where do you look first?" |

Shapes worth reaching for:

* why does this work / why does it fail
* what happens if — and then, what happens if the opposite
* predict the output before we run it
* compare X and Y; when does each win
* find the bug
* design something that satisfies this constraint
* explain it from memory, no notes
* what assumption is this making
* what breaks at scale
* what changes under failure

Skip trivia. Nobody needs the flag name; they need to know the flag exists and
when it matters.

### Reading the answer

* **Fluent and correct** → move on. Do not confirm three times.
* **Correct but hesitant** → one application problem, then move on.
* **Right words, wrong model** → the most important case. Do not accept the
  vocabulary. Make them apply it until the wrong model produces a wrong answer
  they can see.
* **Blank** → back up one dependency and check that instead.

## Practice by domain

Every session should contain active work. Adapt the form to the subject.

**Programming** — implement, debug, modify existing code, predict output, design
an API, investigate a real failure, read source.

**Mathematics** — solve, derive, prove, explain the reasoning aloud, find the
error in a wrong proof.

**Science** — predict an experiment, explain the mechanism, analyse data,
work problems.

**History and humanities** — reconstruct the argument, compare interpretations,
explain causality, work from primary sources.

**Creative and practical skills** — produce something, critique it, revise it,
compare against a strong example.

## Retrieval

Retrieval means pulling from memory, not rereading. Anything where the learner
looks at the source first is review, not retrieval, and does not count.

Warm-up shapes, one to three minutes each:

* "Sketch the flow from memory."
* "Three things you remember about X. Now the one you're least sure of."
* "Last session you said Y. Still true? Why?"
* One problem from the previous session, no notes.

Then tick the interval box in the plan's Spaced Review Schedule.

If retrieval fails badly, that concept is the session — not what was scheduled.

## Difficulty

Move up only when the current level is fluent:

1. recall it
2. apply it to the example from the material
3. apply it to a case they haven't seen
4. apply it under a constraint or failure condition
5. compare it against the alternative and justify the choice
6. teach it back

Round 1 lives at 1–2, Round 2 at 2–4, Round 3 at 4–6.

## Session close

Two minutes, always:

* what they can now do that they couldn't at the start
* the one thing still shaky
* what comes next session

Then write it to `## Learning State` and `log.md` and stop. Do not summarise the
whole session back to them.
