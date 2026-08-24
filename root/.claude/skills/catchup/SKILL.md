# catchup

Quick engineering catch-up skill for understanding what other developers changed since the user's last commit.

Optimized for:

* Claude Haiku
* Fast execution
* Daily development workflow
* Low-token summarization
* High signal/noise ratio

---

## Model

Recommended model:

```text
claude-3-5-haiku
```

Reason:

* fast
* cheap
* sufficient for git diff summarization
* good enough for architectural inference without deep reasoning

---

## Purpose

This skill helps the user quickly understand:

* what changed since their last commit
* what other developers modified
* potential breaking changes
* workflow impact
* risky areas
* architecture or behavior changes
* important files/modules touched

The goal is awareness and fast context loading.

Not deep code review.

---

# Behavior

The assistant should:

* identify the user's latest commit
* collect commits after it from other developers
* summarize the important changes
* infer risks and side effects
* explain likely developer impact
* remain concise and practical

The assistant should NOT:

* explain every commit in detail
* dump raw diffs
* overanalyze trivial changes
* generate release notes style marketing text

---

# User Identity

Git author name:

```text
omarz
```

---

# Execution Flow

## Step 1 — Find Latest User Commit

Run:

```bash
LAST_COMMIT=$(git log --author="omarz" -1 --format="%H")
echo $LAST_COMMIT
```

If no commit is found:

* inform the user
* stop execution

---

## Step 2 — Collect New Commits

Collect commits authored by others after the user's latest commit.

Run:

```bash
git log ${LAST_COMMIT}..HEAD \
  --author='^(?!omarz).*' \
  --perl-regexp \
  --pretty=format:'---COMMIT---%nAuthor: %an%nDate: %ad%nTitle: %s%n' \
  -p
```

---

## Step 3 — Collect File Statistics

Run:

```bash
git diff --stat ${LAST_COMMIT}..HEAD
```

Optional additional context:

```bash
git diff --name-only ${LAST_COMMIT}..HEAD
```

---

# Output Format

The assistant should generate:

---

# Catch Up

Short overview of the overall direction of changes.

---

# Major Changes

Summarize:

* features
* fixes
* refactors
* infra changes
* architecture updates
* API changes
* networking/database/config changes

Group related changes together.

---

# Workflow Impact

Mention anything affecting:

* local development
* CI/CD
* deployment
* environment variables
* database migrations
* testing flow
* APIs
* build/runtime behavior

---

# Potential Risks

Mention:

* possible breaking changes
* risky refactors
* migration concerns
* concurrency/network/cache issues
* compatibility concerns
* operational side effects

---

# Areas Worth Reviewing

Mention:

* heavily modified modules
* important directories
* critical systems touched repeatedly

Examples:

```text
network/
api/
cache/
migrations/
auth/
```

---

# Executive Summary

Provide 2–5 concise bullets describing the most important things the user should know.

---

# Style Rules

The assistant must:

* stay concise
* optimize for fast reading
* avoid repeating commit messages verbatim
* infer intent from diffs
* prioritize impactful changes
* ignore trivial formatting changes
* focus on practical engineering impact

If changes are minor:

* keep response very short

If changes are extensive:

* organize by subsystem

---

# Example Invocation

```text
/catchup
```

Optional future variants:

```text
/catchup today
/catchup 3d
/catchup main
/catchup release
```
