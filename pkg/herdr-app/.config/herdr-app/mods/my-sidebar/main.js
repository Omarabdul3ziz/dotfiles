// Terminals layout's sidebar: each machine with every terminal under it, flat.
// One space per machine, so the list never shows spaces. A row is one terminal:
// ▪ a shell or program, ◆ an agent, ◇ a sub-agent (a terminal another one started).

import { View, div } from "gpui-kit";
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

function reachable() {
  return machines().filter((m) => m.name === null || m.layout !== "unavailable");
}

// program.agent is only set for agents that report their state, which the
// `claude agents` dashboard does not, so known agent programs count too.
const AGENTS = ["claude", "pi", "codex", "opencode", "gemini", "hermes", "amp"];

function marker(t, pane) {
  if (t.parent) return "◇";
  const g = pane?.program ?? t.program;
  const agent = g?.agent || t.status || AGENTS.includes(g?.key) || AGENTS.includes(t.foreground?.name);
  return agent ? "◆" : "▪";
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
    const t = theme();
    const all = terminals();
    const byPane = panes().filter((p) => p.terminal);
    const shown = focused()?.terminal ?? null;
    const here = spaces().find((p) => p.active)?.machine ?? null;

    const row = (term) => {
      const pane = byPane.find((p) => p.terminal === term.address);
      const on = term.address === shown;
      const live = pane?.status ?? term.status;
      const status = live && live !== "idle" ? live : null;
      return own(h_flex())
        .id(`ms-${term.address}`)
        .h(30)
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
        .on_click(() => {
          if (pane) run("pane.focus", { terminal: term.address });
          else if (term.program?.agent || term.parent) run("agent.focus", { terminal: term.address });
          else run("terminal.peek", { terminal: term.address });
        })
        .on_mouse_down("right", () =>
          pane &&
          openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: pane.tab, space: spaceOf(machineOf(term.address))?.id } } }),
        )
        .child(div().flex_none().w(12).text_color(C.dim).child(marker(term, pane)))
        .child(div().flex_1().min_w(0).truncate().text_color(on ? C.text : "#c4c6ca").child(pane?.title || term.name || term.address))
        .when(Boolean(status), (el) => el.child(div().flex_none().w(8).h(8).rounded_full().bg(t[status])));
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
      .size_full()
      .pt(8)
      .px(4)
      .gap(14)
      .overflow_y_scroll()
      .children(machines().map(machine));
  }
}
