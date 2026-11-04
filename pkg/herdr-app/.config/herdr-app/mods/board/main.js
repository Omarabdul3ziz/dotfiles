// One board for all my work: ideas I typed here (ideas.md on this machine), work items (work/<item>/state.md),
// forge issues and PRs (hero_brain's audit, kept fresh on devbox by a systemd
// timer) and running agents. An issue, its work item, its session and its PR
// share a key ("<repo>#<n>") and so one card, which moves along the columns.
// Each machine answers in one exec; the last answers are cached so the board
// paints at once.
//
// The composer at the bottom is the dispatcher: what I type or say goes to a quick Haiku call
// that routes it (inbox it, start an agent, or operate a running one), shows where, and does it
// on a second Enter. Running agents of every machine and any tool are cards too; a live
// agent's status picks its column. Done work sits in a box under the columns.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { agents, terminals, panes, spaces, machines, knownAgents, exec, hc, home, appHome, run, notify, shared, setShared, theme, props, closeOverlay } from "herdr";
import * as fs from "fs/promises";

const FORGE = "https://forge.ourworld.tf";
const COLUMNS = ["todo", "doing", "attention"];
const KINDS = ["idea", "issue", "pr", "agent"];
// dir: the pack's var dir under $HOME; code: where its checkouts live; audit: has hero_brain;
// ideas: keeps ideas.md, the ideas typed into this board (nothing else writes it).
const SOURCES = [
  { machine: "devbox", dir: "hero/var", code: "hero/code", audit: true, ideas: false },
  { machine: null, dir: ".local/state/agents", code: null, audit: false, ideas: true },
];
const DONE_DAYS = 7;
// A just-started card has no session or state.md yet; don't offer "▶ work" again for this long.
const STARTING_MS = 10 * 60 * 1000;
const CACHE = `${appHome()}/mods/board/.cache.json`;

// Everything about one machine; ideas.md goes last so its text is exact.
const READ = `cd "$HOME/$1" 2>/dev/null || exit 0
echo "$HOME"
for f in work/*/state.md; do
  [ -f "$f" ] || continue
  echo "@@state $(basename "$(dirname "$f")") $(stat -c %Y "$f")"
  cat "$f"; echo
done
echo "@@agents"
claude agents --json --all 2>/dev/null | sed -n '/^\\[/,$p'
if [ "$2" = audit ]; then
  echo "@@audit $(stat -c %Y audit.tsv 2>/dev/null || echo 0) $(systemctl --user is-active herdr-audit.service)"
  cat audit.tsv 2>/dev/null
fi
echo "@@folders"
(cd && for g in src/*/.git src/*/*/.git hero/code/*/.git; do [ -e "$g" ] && echo "\${g%/.git}"; done)
echo "@@ideas"
[ "$3" = ideas ] && cat ideas.md 2>/dev/null`;

// Replaces ideas.md only if it still holds what we read.
const WRITE = `f="$HOME/$1/ideas.md"
if [ -e "$f" ]; then printf %s "$2" | cmp -s - "$f" || exit 3; fi
printf %s "$3" > "$f.tmp" && mv "$f.tmp" "$f"`;

// Three things a line can be: kept for later, a new agent, or words for a running one.
const ROUTES = {
  inbox: { label: "Inbox", color: "ansi5" },
  start: { label: "Start", color: "ansi4" },
  operate: { label: "Operate", color: "ansi3" },
};

const ROUTER = `You route one line I typed or dictated to my agent board. Give 1 to 3 options, best first,
each a different route or target. why: at most 8 words.
- inbox: an idea or a reminder for later; nothing starts. text: the idea, tidied.
- start: a new agent on machine + folder (one from that machine's list; forge repos hero_* live on devbox).
  plan: true for work that changes code or needs thought (it plans first and waits for my go);
  false for a small task to just do now (a question, a check, a restart, a lookup). text: the task, with the issue key if any.
- operate: words for a running agent: more instructions for its work, or the answer to what it asks me
  (status blocked, or done and asking). target: its address. text: the message.
Prefer operate when the line clearly continues or answers a running agent.`;

const SCHEMA = JSON.stringify({
  type: "object",
  required: ["options"],
  properties: {
    options: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        required: ["route", "text"],
        properties: {
          route: { enum: Object.keys(ROUTES) },
          plan: { type: "boolean" },
          target: { type: "string" },
          machine: { type: "string" },
          folder: { type: "string" },
          text: { type: "string" },
          why: { type: "string" },
        },
      },
    },
  },
});

const LIVE_RANK = { blocked: 4, done: 3, working: 2, idle: 1 };
const machineOf = (addr) => (addr.includes("/") ? addr.split("/")[0] : null);

const where = (src) => src.machine ?? "local";

function workColumn(stop) {
  if (stop === "plan") return "todo";
  if (stop === "build") return "doing";
  if (stop === "merged" || stop === "done") return "done";
  if (stop === "dropped") return null;
  return "attention"; // ready, blocked, or anything else waiting on me
}

// "org/repo#12", "repo#12" and "repo: #12 …" all name issue 12 of repo.
function keyOf(text) {
  const m = text.match(/([\w.-]+(?:\/[\w.-]+)?)#(\d+)/) ?? text.match(/^([\w.-]+):\s*#(\d+)/);
  return m ? `${m[1].split("/").pop()}#${m[2]}` : null;
}

function fullName(repo) {
  return repo.includes("/") ? repo : `lhumina_code/${repo}`;
}

function parse(src, out) {
  const at = out.lastIndexOf("\n@@ideas\n");
  const head = (at < 0 ? out : out.slice(0, at)).split("\n");
  const m = { home: head[0], items: [], sessions: [], audit: null, folders: [], ideas: at < 0 ? "" : out.slice(at + 9) };
  let sec = null;
  let buf = [];
  const flush = () => {
    if (!sec) return;
    const [kind, ...args] = sec;
    if (kind === "@@state") {
      const f = Object.fromEntries(buf.map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2]]));
      m.items.push({ name: args[0], mtime: Number(args[1]) * 1000, ...f });
    } else if (kind === "@@agents") {
      try {
        m.sessions = JSON.parse(buf.join("\n") || "[]");
      } catch {}
    } else if (kind === "@@folders") {
      m.folders = buf.filter(Boolean).map((d) => `~/${d}`);
    } else if (kind === "@@audit") {
      m.audit = {
        at: Number(args[0]) * 1000,
        running: args[1] === "active" || args[1] === "activating",
        rows: buf.slice(1).filter(Boolean).map((l) => {
          const [where, repo, item, kind, holds, amount, verdict] = l.split("\t");
          return { where, repo, item, kind, holds, amount, verdict };
        }),
      };
    }
  };
  for (const line of head.slice(1)) {
    if (line.startsWith("@@")) {
      flush();
      sec = line.split(" ");
      buf = [];
    } else buf.push(line);
  }
  flush();
  return m;
}

function ago(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default class Board extends View {
  init(_props, cx) {
    this.raw = {}; // where(src) -> last READ output
    this.error = null;
    this.only = null; // the one kind shown, or null for all
    try {
      this.only = localStorage.getItem("only");
    } catch {}
    this.routed = null; // { text, options, at } for the line as typed
    this.routing = null; // the text being routed
    this.tools = {}; // where -> installed knownAgents
    this.input = InputState.new({ placeholder: "Ask, plan, or tell an agent… (an idea, a task, or an answer)" });
    this.input.on("submit", (_e, cx) => this.submit(cx));
    this.input.on("change", (_e, cx) => {
      if (this.routed && this.routed.text !== this.input.value().trim()) this.routed = null;
      cx.notify();
    });
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    for (const src of SOURCES) {
      knownAgents({ on: src.machine })
        .then((list) => { this.tools[where(src)] = list.filter((a) => a.installed); })
        .catch(() => {});
    }
    cx.spawn(async (cx) => {
      try {
        this.raw = JSON.parse(await fs.readFile(CACHE, "utf8"));
        cx.notify();
      } catch {}
      this.reload(cx);
    });
    cx.timer.every(15000, (cx) => this.reload(cx));
  }

  reload(cx) {
    cx.spawn(async (cx) => {
      const errors = [];
      await Promise.all(
        SOURCES.map(async (src) => {
          try {
            const r = await exec("sh", ["-c", READ, "sh", src.dir, src.audit ? "audit" : "", src.ideas ? "ideas" : ""], { on: src.machine });
            if (r.stdout.trim()) this.raw[where(src)] = r.stdout;
          } catch (e) {
            errors.push(`${where(src)}: ${e.message ?? e}`);
          }
        }),
      );
      this.loadError = errors.join(" · ") || null;
      fs.writeFile(CACHE, JSON.stringify(this.raw)).catch(() => {});
      cx.notify();
    });
  }

  data(src) {
    const out = this.raw[where(src)];
    return out ? parse(src, out) : null;
  }

  write(cx, src, edit) {
    const old = this.data(src)?.ideas ?? "";
    const next = edit(old);
    cx.spawn(async (cx) => {
      const r = await exec("sh", ["-c", WRITE, "sh", src.dir, old, next], { on: src.machine }).catch((e) => ({ code: 1, stderr: String(e) }));
      this.error = r.code === 3 ? "ideas.md changed meanwhile; reloaded, try again" : r.code ? `Not saved: ${r.stderr}` : null;
      this.reload(cx);
    });
  }

  add(cx) {
    const v = this.input.value().trim();
    if (!v) return;
    this.input.set_value("");
    this.write(cx, SOURCES.find((s) => s.ideas), (text) => `${text.replace(/\n*$/, "")}${text.trim() ? "\n" : ""}- ${v}\n`);
  }

  remove(cx, line) {
    this.write(cx, line.src, (text) => {
      const lines = text.split("\n");
      if (lines[line.at] === line.raw) lines.splice(line.at, 1);
      return lines.join("\n");
    });
  }

  // `work <what>` in a new herdr tab: it plans, then waits for me in the agents list.
  start(cx, key, src, what, repo) {
    setShared("board.started", { ...this.started(), [key]: Date.now() });
    this.launch(src, src.code && repo ? `~/${src.code}/${repo}` : "~", `work ${what}`);
    notify({ title: "work started", body: `${what.slice(0, 80)} — on ${where(src)}, waits at the plan stop.`, level: "success" });
  }

  // An agent with a first message, in that folder's space on that machine (or a new space).
  launch(src, folder, task, toolKey = "claude") {
    const h = this.data(src)?.home ?? (src.machine ? null : home());
    const abs = h ? folder.replace(/^~(?=\/|$)/, h) : folder;
    const tool = (this.tools[where(src)] ?? []).find((a) => a.key === toolKey) ?? { name: "Claude Code", run: ["claude"] };
    const space = spaces().find((p) => p.machine === src.machine && p.folder === abs);
    if (space) run("tab.new", { space: space.id, name: tool.name, folder: abs, argv: tool.run, task });
    else run("space.new", { machine: src.machine, folder: abs, tab: tool.name, argv: tool.run, task });
  }

  // An idea starts on the machine you're on.
  here() {
    const machine = spaces().find((p) => p.active)?.machine ?? null;
    return SOURCES.find((s) => s.machine === machine) ?? SOURCES.find((s) => s.ideas);
  }

  started() {
    const now = Date.now();
    return Object.fromEntries(Object.entries(shared("board.started") ?? {}).filter(([, at]) => now - at < STARTING_MS));
  }

  attach(src, session) {
    const id = session.slice(0, 8);
    const space = spaces().find((p) => p.active && p.machine === src.machine) ?? spaces().find((p) => p.machine === src.machine);
    closeOverlay(props().overlay);
    if (space) run("tab.new", { space: space.id, name: id, argv: ["claude", "attach", id] });
    else run("space.new", { machine: src.machine, argv: ["claude", "attach", id] });
  }

  // Live agents on every machine, any tool, sub-agents left to their parents. A tool from
  // the menu counts before it reports a status (Claude doesn't until its first turn).
  live() {
    const listed = new Map(agents().map((a) => [a.address, a]));
    const paned = new Map(panes().filter((p) => p.terminal).map((p) => [p.terminal, p]));
    const tabs = new Map(spaces().flatMap((sp) => sp.tabs.map((tb) => [tb.id, { sp, tb }])));
    const tools = new Set(Object.values(this.tools).flat().map((a) => a.key));
    const all = terminals().filter((x) => x.state === "live");
    const byAddr = new Map(all.map((x) => [x.address, x]));
    const isAgent = (x) => listed.has(x.address) || x.program?.agent || tools.has(x.program?.key);
    return all
      .filter((x) => isAgent(x) && !(x.parent && byAddr.has(x.parent) && isAgent(byAddr.get(x.parent))))
      .map((x) => {
        const a = listed.get(x.address);
        const s = a?.status ?? x.status;
        const status = s === "error" ? "blocked" : s ?? null;
        const pane = paned.get(x.address);
        const at = pane && tabs.get(pane.tab);
        // "space · tab", the tab only when someone named it; else its name or folder.
        const name = at ? [at.sp.name, at.tb.named ? at.tb.name : null].filter(Boolean).join(" · ") : x.name || x.cwd?.split("/").pop() || x.address;
        const title = a?.title && a.title !== x.program?.name ? a.title : "";
        return { address: x.address, x, pane: pane?.pane, status, rank: LIVE_RANK[status] ?? 1, name, title, machine: machineOf(x.address) ?? "local" };
      })
      .sort((p, q) => q.rank - p.rank);
  }

  openAgent(r) {
    closeOverlay(props().overlay);
    if (r.pane) run("pane.focus", { pane: r.pane });
    else run("terminal.keep", { terminal: r.address, place: "tab" });
  }

  // What the router sees: live agents (with the screen of the ones that wait on me),
  // folders and installed tools per machine, and the backlog.
  async context(live) {
    const asking = live.filter((r) => r.status === "blocked" || r.status === "done").slice(0, 4);
    const screens = await Promise.all(
      asking.map((r) =>
        hc(["read", r.address])
          .then((o) => o.stdout.split("\n").filter((l) => l.trim()).slice(-20).join("\n"))
          .catch(() => ""),
      ),
    );
    return {
      machines: SOURCES.map((src) => ({
        name: where(src),
        folders: this.data(src)?.folders ?? [],
        tools: (this.tools[where(src)] ?? []).map((a) => a.key),
      })),
      agents: live.map((r) => ({
        address: r.address,
        machine: r.machine,
        tool: r.x.program?.key,
        folder: r.x.cwd,
        where: r.name,
        status: r.status ?? "starting",
        title: r.title,
        screen: screens[asking.indexOf(r)] || undefined,
      })),
      backlog: this.cards().all.filter((c) => c.col === "backlog").map((c) => c.title).slice(0, 40),
    };
  }

  route(cx, text) {
    this.routing = text;
    this.routed = null;
    this.error = null;
    cx.spawn(async (cx) => {
      try {
        const ctx = await this.context(this.live());
        // A bare Haiku: no hooks, MCP, settings, tools or thinking, so it answers in a few seconds.
        const r = await exec("env", [
          "MAX_THINKING_TOKENS=0", "claude", "-p", "--model", "haiku", "--no-session-persistence", "--strict-mcp-config",
          "--setting-sources", "", "--tools", "", "--output-format", "json", "--json-schema", SCHEMA, "--system-prompt", ROUTER,
          `Context:\n${JSON.stringify(ctx)}\n\nMy line: ${text}`,
        ]);
        // mise may print its own lines around the JSON.
        const out = JSON.parse(r.stdout.slice(r.stdout.indexOf("{"), r.stdout.lastIndexOf("}") + 1));
        const options = (out.structured_output?.options ?? []).filter((o) => ROUTES[o.route]);
        if (!options.length) throw new Error("no route");
        // Keeping it for later is always one Tab away.
        if (!options.some((o) => o.route === "inbox")) options.splice(2, 1, { route: "inbox", text, why: "keep it for later" });
        if (this.input.value().trim() === text) this.routed = { text, options, at: 0 };
      } catch (e) {
        this.routed = { text, options: [{ route: "inbox", text, why: "router failed; keep it" }], at: 0 };
        this.error = `routing failed: ${e.message ?? e}`;
      }
      this.routing = null;
      cx.notify();
    });
  }

  // Enter: route the line; Enter again: do what the shown route says.
  submit(cx) {
    const text = this.input.value().trim();
    if (!text || this.routing) return;
    const o = this.routed?.text === text ? this.routed.options[this.routed.at] : null;
    // "idea: …" needs no router.
    const idea = text.match(/^(?:idea|later|inbox)\s*:\s*(.+)$/i);
    if (!o && idea) return this.go(cx, { route: "inbox", text: idea[1] });
    if (!o) return this.route(cx, text);
    this.go(cx, o);
  }

  go(cx, o) {
    this.input.set_value("");
    this.routed = null;
    const src = SOURCES.find((s) => where(s) === o.machine) ?? this.here();
    if (o.route === "inbox") {
      this.write(cx, SOURCES.find((s) => s.ideas), (t) => `${t.replace(/\n*$/, "")}${t.trim() ? "\n" : ""}- ${o.text}\n`);
      return;
    }
    if (o.route === "start") {
      if (o.plan) setShared("board.started", { ...this.started(), [keyOf(o.text) ?? `idea:${o.text}`]: Date.now() });
      this.launch(src, o.folder || "~", o.plan ? `work ${o.text}` : o.text);
      notify({ title: o.plan ? "started · plans first" : "started", body: `${o.text.slice(0, 80)} — ${where(src)} · ${o.folder || "~"}`, level: "success" });
      return;
    }
    // operate: an agent that waits on me shows a question; --force types the answer into it.
    const waiting = this.live().find((r) => r.address === o.target)?.status === "blocked";
    cx.spawn(async (cx) => {
      const r = await hc(["send", ...(waiting ? ["--force"] : []), o.target, o.text]).catch((e) => ({ code: 1, stderr: String(e) }));
      if (r.code) this.error = `not sent: ${(r.stderr || r.stdout).trim().split("\n").pop()}`;
      else notify({ title: "sent", body: `${o.text.slice(0, 80)} → ${o.target}`, level: "success" });
      cx.notify();
    });
  }

  // Dictation types into the focused input; voxtype does the listening.
  voice(cx) {
    this.input.focus();
    exec("voxtype", ["record", "toggle"])
      .then((r) => { if (r.code) this.error = `voice: ${r.stderr.trim() || "voxtype failed"}`; })
      .catch(() => { this.error = "voice needs voxtype (omarchy pkg aur add voxtype)"; })
      .finally(() => cx.notify());
  }

  // A badge shows only its kind; clicking it again shows everything.
  filter(kind) {
    this.only = this.only === kind ? null : kind;
    try {
      if (this.only) localStorage.setItem("only", this.only);
      else localStorage.removeItem("only");
    } catch {}
  }

  // Folds every source into cards: { kind, col, title, tags, src, line, issue, pr, work, session, ... }.
  cards() {
    const byKey = new Map();
    const loose = [];
    const card = (key, src) => {
      if (!key) return loose[loose.push({ src, tags: [] }) - 1];
      if (!byKey.has(key)) byKey.set(key, { key, src, tags: [] });
      return byKey.get(key);
    };
    let strip = null;
    const live = this.live();
    for (const src of SOURCES) {
      const d = this.data(src);
      if (!d) continue;
      const sessions = new Map(d.sessions.map((s) => [s.sessionId, s]));
      const linked = new Set();

      d.ideas.split("\n").forEach((raw, at) => {
        const m = raw.match(/^\s*[-*]\s+(.+)$/);
        if (!m) return;
        const c = card(keyOf(m[1]) ?? `idea:${m[1]}`, src);
        c.line = { src, at, raw, text: m[1] };
        c.title ??= m[1];
      });

      for (const it of d.items) {
        const col = workColumn(it.stop);
        if (!col || (col === "done" && Date.now() - it.mtime > DONE_DAYS * 86400000)) continue;
        // A started idea's work item carries the idea's text as its item.
        const c = card(keyOf(it.item ?? "") ?? (it.item ? `idea:${it.item}` : `work:${where(src)}:${it.name}`), src);
        c.work = { ...it, col, src };
        c.title = it.item || it.name;
        // Only a live session can be attached; an exited one leaves the item to its state.md.
        const s = it.session && sessions.get(it.session);
        if (s?.pid) {
          c.session = s;
          linked.add(s.sessionId);
        } else if (it.session) {
          // A herdr agent: session is its hc address (or name) on that machine.
          const addr = src.machine && !it.session.includes("/") ? `${src.machine}/${it.session}` : it.session;
          c.agent = live.find((r) => r.address === addr || r.x.name === it.session) ?? c.agent;
        }
      }

      if (d.audit) {
        strip = { ...d.audit, risk: d.audit.rows.filter((r) => r.verdict === "at risk").length };
        for (const r of d.audit.rows) {
          const short = r.repo.split("/").pop();
          if (r.where === "issue") {
            const c = card(`${short}${r.item}`, src);
            c.issue = r;
            c.title = c.work ? c.title : `${short}${r.item} ${r.holds}`;
          } else if (r.kind === "PR") {
            const n = r.item.match(/^#(\d+)/)[1];
            const forIssue = r.item.match(/issue(\d+)/)?.[1];
            const c = card(forIssue ? `${short}#${forIssue}` : `${short}!${n}`, src);
            c.pr = { ...r, n };
            c.title ??= `${short} PR #${n} ${r.holds}`;
          }
        }
      }

      for (const s of d.sessions) {
        if (s.kind !== "background" || linked.has(s.sessionId)) continue;
        // An exited session (no pid) is done; older ones drop off like old work.
        if (!s.pid && Date.now() - s.startedAt > DONE_DAYS * 86400000) continue;
        const c = card(null, src);
        c.session = s;
        c.title = s.name || s.sessionId.slice(0, 8);
      }
    }
    // A live agent no work item names gets a card of its own. Only one that reports a status:
    // a terminal viewing a background session (claude attach, claude agents) reports none,
    // and that session already has its card.
    const held = new Set([...byKey.values(), ...loose].map((c) => c.agent?.address));
    for (const r of live) if (r.status && !held.has(r.address)) Object.assign(card(null, null), { agent: r, title: r.title || r.name });
    const all = [...byKey.values(), ...loose].filter((c) => c.title);
    for (const c of all) {
      c.kind = c.pr ? "pr" : c.issue ? "issue" : c.line ? "idea" : "agent";
      const state = c.session ? (c.session.pid ? (c.session.state ?? c.session.status) : "exited") : c.agent?.status;
      c.state = state;
      c.blocked = c.work?.stop === "blocked" || state === "blocked";
      // A live agent's status wins: finished or asking means it waits on me; idle means never run yet.
      if (c.work?.col === "done" || (!c.work && state === "exited")) c.col = "done";
      else if (c.agent || c.session?.pid) c.col = state === "blocked" || state === "done" ? "attention" : "doing";
      else if (c.work) c.col = c.work.col;
      else if (c.pr) c.col = "attention";
      else if (c.issue) c.col = c.issue.verdict === "in flight" ? "doing" : "todo";
      else c.col = "todo";
    }
    return { all, strip };
  }

  button(t, id, label, onClick, solid) {
    return div()
      .id(id)
      .flex_none()
      .px(6)
      .py(1)
      .rounded(5)
      .cursor_pointer()
      .when(solid, (el) => el.bg(t.solid).text_color(t.solid_foreground))
      .when(!solid, (el) => el.text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.foreground)))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        onClick(cx);
      })
      .child(label);
  }

  cardView(t, c, i) {
    const color = { idea: t.ansi5, issue: t.ansi2, pr: t.ansi4, agent: t.ansi3 }[c.kind];
    const full = c.issue || c.pr ? fullName((c.issue ?? c.pr).repo) : null;
    const url = c.pr ? `${FORGE}/${full}/pulls/${c.pr.n}` : c.issue ? `${FORGE}/${full}/issues/${c.issue.item.slice(1)}` : null;
    const tags = [
      c.issue && c.issue.item,
      c.pr && `PR #${c.pr.n}`,
      c.work?.stop && `work: ${c.work.stop}`,
      c.state && (c.session ? `claude ${c.state}` : c.state),
    ].filter(Boolean);
    const machine = c.src ? where(c.src) : (c.agent?.machine ?? "local");
    const open = c.agent
      ? () => this.openAgent(c.agent)
      : c.session?.pid
        ? () => this.attach(c.src, c.session.sessionId)
        : null;
    const key = c.key ?? `line:${c.title}`;
    // A paused work item (no live session, not done) resumes from its state.md.
    const canWork =
      !c.session && !c.agent && !this.started()[key] && (c.work ? c.col !== "done" : c.line || (c.issue && c.issue.verdict === "open, mine"));
    const actions = [
      url && this.button(t, `u-${i}`, "↗", () => exec("xdg-open", [url])),
      canWork &&
        this.button(t, `s-${i}`, "▶ work", (cx) =>
          c.work
            ? this.start(cx, key, c.work.src, c.work.item ?? c.work.name, c.key?.includes("#") ? c.key.split("#")[0] : null)
            : c.issue
              ? this.start(cx, key, c.src, `${fullName(c.issue.repo)}${c.issue.item}`, c.issue.repo.split("/").pop())
              : this.start(cx, key, this.here(), c.line.text, c.line.text.match(/^([\w.-]+):/)?.[1]),
        ),
      c.line && this.button(t, `x-${i}`, "×", (cx) => this.remove(cx, c.line)),
    ].filter(Boolean);
    return h_flex()
      .id(`c-${i}`)
      .rounded(8)
      .bg(t.raised)
      .border_1()
      .border_color(c.blocked ? t.blocked : t.border)
      .overflow_hidden()
      .when(Boolean(open), (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_click(open))
      .child(div().flex_none().w(4).h_full().bg(color))
      .child(
        v_flex()
          .flex_1()
          .min_w(0)
          .p(8)
          .gap(5)
          .child(div().text_color(t.foreground).child(c.title))
          .child(
            h_flex()
              .gap(6)
              .items_center()
              .text_size(11)
              .child(
                machine === "local"
                  ? div().flex_none().px(5).rounded(4).border_1().border_color(t.border).text_color(t.dim).child(machine)
                  : div().flex_none().px(5).rounded(4).bg(t.ansi6).text_color(t.background).child(machine),
              )
              .child(div().truncate().text_color(t.dim).child(tags.join(" · "))),
          )
          .when(Boolean(c.work?.now), (el) => el.child(div().text_size(11).truncate().text_color(t.muted).child(c.work.now)))
          .when(actions.length > 0, (el) => el.child(h_flex().gap(2).text_size(12).child(div().flex_1()).children(actions))),
      );
  }

  status(t, s) {
    if (s === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900);
    if (s === "idle" || !s) return div().size(8).mx(2).flex_none().rounded_full().border(1.5).border_color(t.idle ?? t.dim);
    return div().size(8).mx(2).flex_none().rounded_full().bg(t[s] ?? t.dim);
  }

  // Where a route goes, in words.
  routeLabel(o, live) {
    if (o.route === "inbox") return "Inbox";
    if (o.route === "start") {
      const folder = (o.folder || "~").split("/").pop() || "~";
      return `Start · ${o.plan ? "plans first" : "now"} · ${o.machine ?? "local"} · ${folder}`;
    }
    const a = live.find((r) => r.address === o.target);
    return `Operate · ${a ? [a.name, a.machine === "local" ? null : a.machine].filter(Boolean).join(" · ") : o.target}`;
  }

  // The composer: a centered box at the bottom, like a chat app's. Enter routes, Enter again goes.
  dispatcher(t, live) {
    const typed = this.input.value().trim();
    const r = this.routed?.text === typed ? this.routed : null;
    const sel = r?.options[r.at];
    const chip = (o, i) => {
      const on = i === r.at;
      const c = t[ROUTES[o.route].color];
      return h_flex().id(`route-${i}`).gap(7).px(10).h(28).rounded_full().items_center().flex_none().cursor_pointer()
        .border_1().border_color(on ? c : t.border).bg(on ? t.selected : t.surface)
        .hover((s) => s.bg(t.hover))
        .on_click((_e, cx) => { r.at = i; this.go(cx, o); cx.notify(); })
        .child(div().size(7).rounded_full().bg(c).flex_none())
        .child(div().max_w(320).truncate().text_color(on ? t.foreground : t.muted).child(this.routeLabel(o, live)));
    };
    const round = (id, label, solid, tip, click) =>
      div().id(id).size(32).flex_none().flex().items_center().justify_center().rounded_full().cursor_pointer().tooltip(tip)
        .when(solid, (el) => el.bg(t.solid).text_color(t.solid_foreground))
        .when(!solid, (el) => el.text_color(t.muted).hover((s) => s.bg(t.hover).text_color(t.foreground)))
        .on_click((_e, cx) => click(cx))
        .child(label);
    const footer = h_flex().px(10).pb(10).pt(2).gap(6).items_center().text_size(12.5)
      .when(Boolean(this.routing), (el) => el
        .child(svg("mods/workspace-chrome/spinner.svg").size(13).flex_none().text_color(t.accent).spin(900))
        .child(div().text_color(t.dim).child("Finding where this goes…")))
      .when(!this.routing && Boolean(r), (el) => el.child(h_flex().flex_1().min_w(0).gap(6).flex_wrap().children(r.options.map(chip))))
      .when(!this.routing && !r, (el) => el.children(Object.values(ROUTES).map((v) =>
        h_flex().gap(6).px(8).h(28).items_center().text_color(t.dim)
          .child(div().size(7).rounded_full().bg(t[v.color]).flex_none()).child(v.label))))
      .child(div().flex_1())
      .child(round("mic", div().text_size(15).child("🎙"), false, "Dictate (voxtype)", (cx) => this.voice(cx)))
      .child(round("go", div().text_size(15).font_semibold().child(r ? "⏎" : "↑"), Boolean(typed), r ? "Go" : "Route", (cx) => this.submit(cx)));
    return v_flex().w_full().items_center().gap(6).flex_none()
      .child(v_flex().w_full().max_w(880).rounded(18).border_1().bg(t.surface).shadow_lg()
        .border_color(sel ? t[ROUTES[sel.route].color] : t.input)
        .child(Input.new(this.input).w_full().h(46).px(16).pt(6).text_size(14.5).text_color(t.foreground))
        .when(Boolean(sel && sel.text !== typed), (el) => el.child(div().px(16).pb(4).text_size(12).text_color(t.muted).truncate()
          .child(`${sel.route === "operate" ? "sends" : "as"} “${sel.text}”${sel.why ? ` — ${sel.why}` : ""}`)))
        .child(footer))
      .child(div().text_size(11).text_color(t.dim)
        .child(r ? "⏎ go · Tab next · Esc clear" : "Enter shows where it goes · nothing happens until a second Enter · “idea: …” goes straight to the inbox"));
  }

  render() {
    const t = theme();
    const { all, strip } = this.cards();
    const live = this.live();
    const shown = all.filter((c) => !this.only || c.kind === this.only);
    const done = shown.filter((c) => c.col === "done");
    const color = { idea: t.ansi5, issue: t.ansi2, pr: t.ansi4, agent: t.ansi3 };
    const err = this.error ?? this.loadError;
    return v_flex()
      .size_full()
      .p(14)
      .gap(10)
      .bg(t.background)
      .text_size(13)
      .on_key_down((e, cx) => {
        const r = this.routed;
        if (e.key === "tab" && r) r.at = (r.at + (e.modifiers.shift ? r.options.length - 1 : 1)) % r.options.length;
        else if (e.key === "escape" && (r || this.input.value())) {
          this.routed = null;
          this.input.set_value("");
        } else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(
        h_flex()
          .gap(10)
          .items_center()
          .text_size(12)
          .text_color(t.dim)
          .child(div().font_semibold().text_color(t.foreground).child("Board"))
          .children(
            KINDS.map((k) =>
              div()
                .id(`f-${k}`)
                .px(8)
                .py(2)
                .rounded_full()
                .border_1()
                .border_color(color[k])
                .text_size(11.5)
                .cursor_pointer()
                .when(!this.only || this.only === k, (el) => el.bg(color[k]).text_color(t.background))
                .when(Boolean(this.only) && this.only !== k, (el) => el.text_color(t.dim))
                .on_click((_e, cx) => {
                  this.filter(k);
                  cx.notify();
                })
                .child(`${k} ${all.filter((c) => c.kind === k).length}`),
            ),
          )
          .when(Boolean(strip), (el) =>
            el
              .child(div().text_color(strip.risk ? t.blocked : t.dim).child(`at risk ${strip.risk}`))
              .child(div().child(strip.running ? "auditing…" : strip.at ? `forge audited ${ago(strip.at)}` : "never audited")),
          )
          .child(div().flex_1())
          .when(Boolean(err), (el) => el.child(div().truncate().text_color(t.blocked).child(err))),
      )
      .child(
        h_flex()
          .flex_1()
          .min_h(0)
          .gap(10)
          .children(
            COLUMNS.map((col) => {
              const mine = shown.filter((c) => c.col === col);
              return v_flex()
                .id(`col-${col}`)
                .flex_1()
                .min_w(0)
                .h_full()
                .p(8)
                .gap(8)
                .rounded(10)
                .bg(t.chrome)
                .overflow_y_scrollbar()
                .child(
                  h_flex()
                    .gap(6)
                    .text_size(12)
                    .child(div().font_semibold().text_color(t.muted).child(col))
                    .child(div().text_color(t.dim).child(String(mine.length))),
                )
                .children(mine.map((c) => this.cardView(t, c, all.indexOf(c))));
            }),
          ),
      )
      .when(done.length > 0, (el) =>
        el.child(
          h_flex()
            .id("done-toggle")
            .flex_none()
            .self_start()
            .gap(6)
            .px(10)
            .py(4)
            .rounded(8)
            .bg(t.chrome)
            .text_size(12)
            .cursor_pointer()
            .on_click((_e, cx) => {
              this.doneOpen = !this.doneOpen;
              cx.notify();
            })
            .child(div().text_color(t.dim).child(this.doneOpen ? "▾" : "▸"))
            .child(div().font_semibold().text_color(t.muted).child("done"))
            .child(div().text_color(t.dim).child(String(done.length))),
        ),
      )
      .when(Boolean(this.doneOpen) && done.length > 0, (el) =>
        el.child(
          h_flex()
            .id("done")
            .flex_none()
            .max_h(150)
            .flex_wrap()
            .gap(8)
            .overflow_y_scrollbar()
            .children(done.map((c) => div().w(260).child(this.cardView(t, c, all.indexOf(c))))),
        ),
      )
      .child(this.dispatcher(t, live));
  }
}
