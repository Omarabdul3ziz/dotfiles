
## Claude Code only
- Background agents run in hc (herdr-core), any tool, any machine:
  `hc run --bg --no-parent --outlive-parent --name <name> --cwd <repo> [--on <machine>] claude "work <item>"`
  from the repo's main checkout. All of them, every machine: `hc ls`, or Super+A /
  Ctrl+Shift+A (the herdr-app `dispatch` popup). `session:` in `state.md` is the
  hc address (`t7`, `devbox/t7`).
- "clean done agents" → `hc kill` + `hc rm` only terminals whose `state.md` says merged or
  dropped, and read-only ones I have seen. List the rest.
- Web-search sub-agents run on Haiku.
- Session routing: if the first message asks for work "in session
  <name|number|id>", do not do it here. Run ListAgents, match the session
  (fuzzy name, id prefix, or number = position in the list), SendMessage it the
  request verbatim minus the routing words, reply one line saying where it
  went, then `claude stop $(basename $CLAUDE_JOB_DIR)` as the very last action.
  No match or ambiguous → ask which one.
