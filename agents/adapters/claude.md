
## Claude Code only
- Background agents: `claude --bg -n <name> "work <item>"` from the repo's main
  checkout; live ones are in `claude agents --json`; resume with
  `claude --bg --resume <session>`. `session:` in `state.md` is
  `$CLAUDE_CODE_SESSION_ID`.
- "clean done agents" → `claude rm` only sessions whose `state.md` says merged or
  dropped, and read-only sessions I have seen. List the rest.
- Web-search sub-agents run on Haiku.
- Session routing: if the first message asks for work "in session
  <name|number|id>", do not do it here. Run ListAgents, match the session
  (fuzzy name, id prefix, or number = position in the list), SendMessage it the
  request verbatim minus the routing words, reply one line saying where it
  went, then `claude stop $(basename $CLAUDE_JOB_DIR)` as the very last action.
  No match or ambiguous → ask which one.
