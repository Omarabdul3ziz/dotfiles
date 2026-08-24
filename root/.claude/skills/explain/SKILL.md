---
name: explain
description: Explains an entire codebase with analogies, diagrams, and structured breakdowns. Outputs a complete overview file.
version: 1.1
---

## Purpose
Provide a clear, structured understanding of a full codebase: behavior, architecture, and design decisions.

## Scope
- Analyze the entire source directory (or project root if not specified)
- Treat the codebase as a system, not isolated snippets
- Identify entrypoints, core modules, and data flow

## When to Use
- Understanding a new project
- Architecture walkthrough
- Codebase documentation
- Debugging system-level behavior

## Output Requirement
- Generate a complete explanation of the whole codebase
- Write the final result into `.claude/OVERVIEW.md`
- Output should be usable as standalone documentation

## Output Structure

### 1. High-Level Analogy
Explain the whole system using a real-world analogy.

### 2. System Diagram
ASCII diagram showing:
- Main components
- Data flow
- Entry points

### 3. Execution Flow
- How the app starts
- Key runtime paths
- Request / job lifecycle

### 4. Project Structure
- Folder/file breakdown of `src/`
- Purpose of each major module

### 5. Component Interactions
- How modules communicate
- Dependencies and boundaries

### 6. Design Decisions
- Architecture patterns used
- Trade-offs and reasoning

### 7. Gotchas
- Hidden coupling
- Edge cases
- Common pitfalls

### 8. Usage
- How to run the project
- Example flows or inputs/outputs

### 9. Extending
- Where to add features
- Safe extension points
- Critical parts to avoid breaking

### 10. Improvements
- Refactoring opportunities
- Performance or reliability issues

## Style Guidelines
- Clear, concise, conversational
- Prefer simple explanations
- Keep diagrams minimal but meaningful

## How It Works
- Scans full source tree
- Identifies entrypoints and core modules
- Builds a system-level explanation

## Extending the Skill
- Add language-specific rules (Go, TS, etc.)
- Add sections (security, testing, performance)
- Enforce stricter documentation requirements
