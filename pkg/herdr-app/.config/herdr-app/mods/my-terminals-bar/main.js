// Terminals layout's draggable top bar: machine switch, tabs, new tab, window controls.
// One space per machine, so the bar never shows spaces.

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, machines, run, theme, openOverlay, nextCommand, window as win } from "herdr";

const C = {
  tray: "#1d1f22",
  // The shown tab stands out; a hovered one only hints, so the two never look alike.
  tab: "#34373c",
  tabEdge: "#4a4d53",
  hover: "#ffffff07",
  edge: "#383b40",
  chip: "#252628",
  text: "#e8e9eb",
  dim: "#8b8f95",
};

// The pane a tab's tab speaks for: the focused one, else its agent, else the first.
function lead(all, id) {
  const mine = all.filter((p) => p.tab === id);
  return mine.find((p) => p.focused) ?? mine.find((p) => p.program?.agent) ?? mine[0];
}

// The program's tile from the app's table: its color, its glyph (or logo) on it.
function tile(t, p) {
  const g = p?.program;
  const dot = p?.status && p.status !== "idle" ? t[p.status] : null;
  return div()
    .relative()
    .flex_none()
    .w(26)
    .h(26)
    .rounded(7)
    .border_1()
    .border_color("#ffffff14")
    .bg(g?.tile ?? C.chip)
    .flex()
    .items_center()
    .justify_center()
    .when(Boolean(g?.icon), (el) =>
      el.child(g.tint ? svg(g.icon).size(15).text_color(g.color ?? C.text) : image(g.icon).w(15).h(15)),
    )
    .when(Boolean(dot), (el) =>
      el.child(div().absolute().top(-4).right(-4).w(11).h(11).rounded_full().border_2().border_color(C.tray).bg(dot)),
    );
}

// A control in the draggable bar: the press is its own, not the window's
// (a right press there would open the system's window menu).
function own(el) {
  return el.on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_mouse_down("right", (_e, cx) => cx.stop_propagation());
}

function windowButton(id, icon, command) {
  return own(
    div()
      .id(id)
      .flex_none()
      .w(24)
      .h(24)
      .rounded_full()
      .flex()
      .items_center()
      .justify_center()
      .bg(C.chip)
      .text_color(C.dim)
      .cursor_pointer()
      .hover((s) => s.bg(C.edge).text_color(C.text))
      .on_click(() => run(command))
      .child(svg(`mods/my-terminals-bar/${icon}.svg`).size(14)),
  );
}

// A text glyph, not an svg: the app skips svgs that are symlinks out of its
// home, and every file here is stowed as one.
function newTabButton(onClick) {
  return own(div())
    .id("tm-new")
    .flex_none()
    .w(30)
    .h(30)
    .rounded(8)
    .flex()
    .items_center()
    .justify_center()
    .text_size(20)
    .text_color(C.dim)
    .cursor_pointer()
    .hover((s) => s.bg(C.chip).text_color(C.text))
    .on_click(onClick)
    .child("+");
}

function goMachine(machine) {
  const first = spaces().find((p) => p.machine === machine);
  if (first) run("space.select", { id: first.id });
  else run("space.new", machine ? { machine } : {});
}

function reachable() {
  return machines().filter((m) => m.name === null || m.layout !== "unavailable");
}

function machineButtons(active) {
  const all = reachable();
  if (all.length < 2) return null;
  return h_flex()
    .flex_none()
    .h(30)
    .p(3)
    .gap(2)
    .rounded_full()
    .bg(C.tray)
    .children(
      all.map((m) => {
        const on = m.name === active;
        return own(div())
          .id(`tm-machine-${m.name ?? "here"}`)
          .h_full()
          .px(10)
          .flex()
          .items_center()
          .rounded_full()
          .cursor_pointer()
          .text_size(12)
          .when(on, (el) => el.bg(C.tab).text_color(C.text))
          .when(!on, (el) => el.text_color(C.dim).hover((s) => s.bg(C.hover).text_color(C.text)))
          .when(m.layout === "loading", (el) => el.opacity(0.5))
          .on_click(() => goMachine(m.name))
          .child(m.name ?? "local");
      }),
    );
}

export default class TerminalsBar extends View {
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
    const space = spaces().find((p) => p.active);
    if (!space) return div();
    const all = panes();
    const w = win() ?? {};
    const mbar = machineButtons(space.machine);

    const tab = (c) => {
      const p = lead(all, c.id);
      return own(h_flex())
        .id(`tm-${c.id}`)
        .flex_shrink(1)
        .w(260)
        .min_w(0)
        .h_full()
        .pl(5)
        .pr(12)
        .gap(9)
        .items_center()
        .rounded(13)
        .border_1()
        .cursor_pointer()
        .text_size(13)
        .when(c.active, (el) => el.bg(C.tab).border_color(C.tabEdge))
        .when(!c.active, (el) => el.border_color("#00000000").hover((s) => s.bg(C.hover)))
        .on_click(() => run("tab.select", { id: c.id }))
        .on_mouse_down("right", () =>
          openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }),
        )
        .child(tile(t, p))
        .child(div().min_w(0).truncate().text_color(c.active ? C.text : "#c4c6ca").child(c.name));
    };

    return h_flex()
      .size_full()
      .gap(8)
      .items_center()
      // macOS: the window buttons sit here (the layout's traffic_lights).
      .when(w.platform === "macos" && w.titlebar === "none" && !w.fullscreen, (el) => el.pl(72))
      .when(Boolean(mbar), (el) => el.child(mbar))
      .child(
        h_flex()
          .flex_shrink(1)
          .min_w(0)
          .h(36)
          .p(3)
          .gap(3)
          .rounded(16)
          .bg(C.tray)
          .children(space.tabs.map(tab)),
      )
      .child(newTabButton(() => run("tab.new", { space: space.id })))
      .child(div().flex_1())
      .when(Boolean(w.buttons), (el) =>
        el.child(
          h_flex()
            .flex_none()
            .pl(6)
            .pr(4)
            .gap(8)
            .child(windowButton("tm-min", "win-min", "window.minimize"))
            .child(windowButton("tm-max", w.maximized ? "win-restore" : "win-max", "window.maximize"))
            .child(windowButton("tm-close", "win-close", "window.close")),
        ),
      );
  }
}
