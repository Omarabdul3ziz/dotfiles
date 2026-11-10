// Terminals layout's sidebar: each machine with every terminal under it, flat.
// One space per machine, so the list never shows spaces. A row is one terminal:
// its program's icon, then the tab's name if someone named it, else the shell's
// folder or the program's title. ↳ marks a sub-agent (a terminal another one started).
// Hover shows × to close; drag a row onto another of the same machine to move its tab there.

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, panes, terminals, machines, focused, run, theme, openOverlay, nextCommand } from "herdr";

const C = {
  // The shown terminal stands out; a hovered one only hints, so the two never look alike.
  row: "#34373c",
  rowEdge: "#4a4d53",
  hover: "#ffffff07",
  chip: "#252628",
  text: "#e8e9eb",
  dim: "#8b8f95",
  bg: "#131619",
};

// A control in the draggable sidebar: the press is its own, not the window's
// (a right press there would open the system's window menu).
function own(el) {
  return el.on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_mouse_down("right", (_e, cx) => cx.stop_propagation());
}

const spaceOf = (machine) => spaces().find((p) => p.machine === machine);
const machineOf = (address) => (address.includes("/") ? address.split("/")[0] : null);

function goMachine(machine) {
  const first = spaceOf(machine);
  if (first) run("space.select", { id: first.id });
  else run("space.new", { machine: machine ?? "" });
}

function newTab(machine) {
  const space = spaceOf(machine);
  if (space) run("tab.new", { space: space.id });
  else run("space.new", { machine: machine ?? "" });
}

// The tab when it holds only this terminal, else just its pane; a sub-agent with no pane ends.
function close(term, pane, tab) {
  if (tab?.panes === 1) run("tab.close", { id: tab.id });
  else if (pane) run("pane.close", { pane: pane.pane });
  else run("terminal.kill", { terminal: term.address });
}

function open(term, pane) {
  if (pane) run("pane.focus", { terminal: term.address });
  else if (term.program?.agent || term.parent) run("agent.focus", { terminal: term.address });
  else run("terminal.peek", { terminal: term.address });
}

function reachable() {
  return machines().filter((m) => m.name === null || m.layout !== "unavailable");
}

// Agents the program table can't see: the `claude agents` dashboard reports no
// state, and a machine without /proc (devbox) reports no foreground program, so
// fall back to the agent's name in the title.
const AGENTS = ["claude", "omp", "pi", "codex", "opencode", "gemini", "hermes", "amp"];

function program(t, pane) {
  const g = pane?.program ?? t.program;
  if (g && !g.shell) return g;
  const title = (pane?.title ?? "").toLowerCase();
  const key = AGENTS.find((a) => new RegExp(`\\b${a}\\b`).test(title));
  return key ? { ...g, key, icon: `icons/${key === "omp" ? "pi" : key}.svg`, tint: false, tile: null } : g;
}

// The program's tile from the app's table: its glyph (or logo), and a dot when
// its agent is busy, blocked or done.
function tile(th, g, status) {
  const dot = status && status !== "idle" ? th[status] : null;
  return div()
    .relative()
    .flex_none()
    .w(22)
    .h(22)
    .rounded(6)
    .border_1()
    .border_color("#ffffff14")
    .bg(g?.tile ?? C.chip)
    .flex()
    .items_center()
    .justify_center()
    .when(Boolean(g?.icon), (el) =>
      el.child(g.tint ? svg(g.icon).size(13).text_color(g.color ?? C.text) : image(g.icon).w(13).h(13)),
    )
    .when(Boolean(dot), (el) =>
      el.child(div().absolute().top(-4).right(-4).w(10).h(10).rounded_full().border_2().border_color(C.bg).bg(dot)),
    );
}

const home = (cwd) => (cwd ?? "").replace(/^\/home\/[^/]+/, "~");

function label(t, pane, tab) {
  if (tab?.named && tab.panes === 1) return tab.name;
  const g = pane?.program ?? t.program;
  if (g?.shell && pane?.cwd) return home(pane.cwd);
  return pane?.title || t.name || t.address;
}

// One machine's live terminals: those in panes in tab order, each followed by the
// sub-agents it started, then any terminal no pane shows.
function rowsOf(machine, all, byPane) {
  const mine = all.filter((t) => t.state === "live" && machineOf(t.address) === machine);
  const out = [];
  const add = (t) => {
    if (out.includes(t)) return;
    out.push(t);
    mine.filter((c) => c.parent === t.address).forEach(add);
  };
  for (const p of byPane) {
    const t = mine.find((x) => x.address === p.terminal);
    if (t) add(t);
  }
  mine.forEach(add);
  return out;
}

export default class Sidebar extends View {
  init(_props, cx) {
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        const step = c === "next-machine" ? 1 : c === "prev-machine" ? -1 : 0;
        const all = reachable().map((m) => m.name);
        const here = spaces().find((p) => p.active)?.machine ?? null;
        if (step && all.length > 1) goMachine(all[(all.indexOf(here) + step + all.length) % all.length]);
        // Touching cx ends this loop once a newer build of the mod replaces it.
        cx.notify();
      }
    });
  }

  render() {
    const th = theme();
    const tabs = spaces().flatMap((s) => s.tabs);
    const all = terminals();
    const byPane = panes().filter((p) => p.terminal);
    const shown = focused()?.terminal ?? null;
    const here = spaces().find((p) => p.active)?.machine ?? null;

    const row = (term) => {
      const pane = byPane.find((p) => p.terminal === term.address);
      const on = term.address === shown;
      const tab = tabs.find((c) => c.id === pane?.tab);
      const target = this.pressed && this.pressed.address !== term.address && this.hovered === term.address;
      return own(h_flex())
        .id(`ms-${term.address}`)
        .h(32)
        .ml(6)
        .pl(8)
        .pr(8)
        .gap(8)
        .items_center()
        .rounded(9)
        .border_1()
        .cursor_pointer()
        .text_size(13)
        .when(on, (el) => el.bg(C.row).border_color(C.rowEdge))
        .when(!on, (el) => el.border_color("#00000000").hover((s) => s.bg(C.hover)))
        .when(target, (el) => el.border_color(th.accent))
        .on_hover((hover, cx) => {
          if (hover) this.hovered = term.address;
          else if (this.hovered === term.address) this.hovered = null;
          cx.notify();
        })
        .on_mouse_down("left", (_e, cx) => {
          this.pressed = { address: term.address, tab };
          cx.notify();
        })
        .on_mouse_up("left", (_e, cx) => {
          const from = this.pressed;
          this.pressed = null;
          cx.notify();
          // No press on this row (the × took it): nothing to do.
          if (!from) return;
          if (from.address === term.address) return open(term, pane);
          const same = machineOf(from.address) === machineOf(term.address);
          if (same && from.tab && tab && from.tab.id !== tab.id) run("tab.move", { id: from.tab.id, index: tab.index });
        })
        .on_mouse_down("right", () =>
          pane &&
          openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: pane.tab, space: spaceOf(machineOf(term.address))?.id } } }),
        )
        .when(Boolean(term.parent), (el) => el.child(div().flex_none().text_color(C.dim).child("↳")))
        .child(tile(th, program(term, pane), pane?.status ?? term.status))
        .child(div().flex_1().min_w(0).truncate().text_color(on ? C.text : "#c4c6ca").child(label(term, pane, tab)))
        .when(this.hovered === term.address && !this.pressed, (el) =>
          el.child(
            own(div())
              .id(`ms-close-${term.address}`)
              .flex_none()
              .w(18)
              .h(18)
              .rounded(5)
              .flex()
              .items_center()
              .justify_center()
              .text_color(C.dim)
              .hover((s) => s.bg(C.chip).text_color(C.text))
              .on_click((_e, cx) => {
                cx.stop_propagation();
                this.hovered = null;
                close(term, pane, tab);
              })
              .child("×"),
          ),
        );
    };

    const machine = (m) => {
      const key = m.name ?? "here";
      return v_flex()
        .gap(2)
        .when(m.layout === "unavailable", (el) => el.opacity(0.4))
        .child(
          h_flex()
            .h(28)
            .pl(6)
            .items_center()
            .child(
              own(div())
                .id(`ms-machine-${key}`)
                .flex_1()
                .cursor_pointer()
                .text_size(12)
                .text_color(m.name === here ? C.text : C.dim)
                .hover((s) => s.text_color(C.text))
                .when(m.layout === "loading", (el) => el.opacity(0.5))
                .on_click(() => goMachine(m.name))
                .child(m.name ?? "local"),
            )
            // A text glyph, not an svg: the app skips svgs that are symlinks out of
            // its home, and every file here is stowed as one.
            .child(
              own(div())
                .id(`ms-new-${key}`)
                .w(24)
                .h(24)
                .rounded(6)
                .flex()
                .items_center()
                .justify_center()
                .text_size(17)
                .text_color(C.dim)
                .cursor_pointer()
                .hover((s) => s.bg(C.chip).text_color(C.text))
                .on_click(() => newTab(m.name))
                .child("+"),
            ),
        )
        .children(rowsOf(m.name, all, byPane).map(row));
    };

    return v_flex()
      .id("ms-tree")
      // A drag let go outside any row is no move.
      .on_mouse_up("left", (_e, cx) => {
        this.pressed = null;
        cx.notify();
      })
      .size_full()
      .pt(8)
      .px(4)
      .gap(14)
      .overflow_y_scroll()
      .children(machines().map(machine));
  }
}
