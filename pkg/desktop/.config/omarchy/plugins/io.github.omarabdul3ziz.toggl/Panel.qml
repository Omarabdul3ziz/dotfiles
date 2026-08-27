import QtQuick
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

// Toggl Track: running timer in the bar, with today/week totals, a per-project
// breakdown, and one-click resume in the popup.
//
// All rendering reads `omarchy-toggl data`, which computes from a local cache --
// opening this panel costs no Toggl API calls. The elapsed clock ticks here in
// QML off `current.start`, so it stays live between refreshes.
Panel {
  id: root
  moduleName: "io.github.omarabdul3ziz.toggl"
  ipcTarget: "io.github.omarabdul3ziz.toggl"

  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color urgent: bar ? bar.urgent : Color.urgent
  readonly property color dim: Qt.darker(foreground, 1.55)
  readonly property color track: Style.selectedFillFor(foreground, Color.accent)
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family

  readonly property int refreshSec: Math.max(5, parseInt(String(setting("refreshIntervalSec", 30)), 10) || 30)
  readonly property string timeFormat: String(setting("timeFormat", "hh:mm"))

  property var payload: null
  property bool busy: false
  // Ticked once a second so the clock keeps counting while the panel sits open.
  property double nowMs: Date.now()

  readonly property bool ready: !!(payload && payload.ok)
  readonly property bool running: !!(ready && payload.running)
  readonly property var current: ready ? payload.current : null
  readonly property var today: ready ? payload.today : null
  readonly property var week: ready ? payload.week : null
  readonly property var recent: ready && payload.recent ? payload.recent : []
  readonly property var projects: ready && payload.projects ? payload.projects : []
  readonly property var tasks: ready && payload.tasks ? payload.tasks : []
  readonly property int cooldown: ready ? Number(payload.cooldown || 0) : 0
  readonly property string errorText: payload && !payload.ok ? String(payload.error || "Unavailable") : ""

  readonly property int elapsed: {
    if (!running || !current) return 0
    var t = Date.parse(String(current.start || ""))
    if (isNaN(t)) return Number(current.elapsed || 0)
    return Math.max(0, Math.floor((nowMs - t) / 1000))
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
  function alpha(c, a) { return Qt.rgba(c.r, c.g, c.b, a) }
  function pad2(n) { n = Math.floor(n); return n < 10 ? "0" + n : "" + n }
  function clockText(s) { return pad2(s / 3600) + ":" + pad2((s % 3600) / 60) + ":" + pad2(s % 60) }
  function shortClock(s) { return pad2(s / 3600) + ":" + pad2((s % 3600) / 60) }
  function pillClock(s) {
    if (timeFormat === "hh:mm:ss") return clockText(s)
    return shortClock(s)
  }
  function human(s) {
    s = Math.floor(s)
    if (s < 60) return s + "s"
    if (s < 3600) return Math.floor(s / 60) + "m"
    return Math.floor(s / 3600) + "h " + Math.floor((s % 3600) / 60) + "m"
  }
  // Toggl hands back project colors as hex; fall back to the bar foreground.
  // The project is what you actually track against, so it leads. A description
  // is a secondary note, and an absent one is never called out.
  function leadLabel(e) {
    if (!e) return ""
    var p = String(e.project || "").trim()
    if (p !== "") return p
    var d = String(e.description || "").trim()
    return d !== "" ? d : "No project"
  }
  function subLabel(e) {
    if (!e) return ""
    var p = String(e.project || "").trim()
    var d = String(e.description || "").trim()
    return (p !== "" && d !== "") ? d : ""
  }
  function projColor(c) {
    var s = String(c || "")
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s : root.dim
  }

  implicitWidth: pill.implicitWidth
  implicitHeight: pill.implicitHeight

  // ---------- data ----------

  Process {
    id: dataProc
    command: ["omarchy-toggl", "data"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var raw = String(text || "").trim()
        if (!raw) return
        try { root.payload = JSON.parse(raw) } catch (e) { /* keep last good data */ }
      }
    }
  }
  function reload() { if (!dataProc.running) dataProc.running = true }

  Process {
    id: actionProc
    onExited: { root.busy = false; Qt.callLater(root.reload) }
  }
  function act(args) {
    if (actionProc.running) return
    root.busy = true
    actionProc.command = args
    actionProc.running = true
  }

  function toggleTimer() { act(["omarchy-toggl", root.running ? "stop" : "start"]) }
  function resumeAt(i)   { act(["omarchy-toggl", "resume", String(i)]) }
  function startNamed(d) {
    var s = String(d || "").trim()
    if (s === "") return
    act(["omarchy-toggl", "start", s])
  }
  // The description field is optional: clicking a project starts it either way.
  function startProject(pid, desc) {
    var a = ["omarchy-toggl", "start", "-p", String(pid)]
    var d = String(desc || "").trim()
    if (d !== "") a.push(d)
    act(a)
  }
  function startTask(tid, pid, desc) {
    var a = ["omarchy-toggl", "start", "-t", String(tid)]
    if (pid) { a.push("-p"); a.push(String(pid)) }
    var d = String(desc || "").trim()
    if (d !== "") a.push(d)
    act(a)
  }

  Timer { interval: 1000; repeat: true; running: true; onTriggered: root.nowMs = Date.now() }
  Timer {
    interval: root.refreshSec * 1000
    repeat: true; running: true; triggeredOnStart: true
    onTriggered: root.reload()
  }
  // Watchdog: never let a wedged helper block future refreshes.
  Timer {
    interval: 20000; repeat: true; running: true
    onTriggered: {
      if (dataProc.running) dataProc.running = false
      if (actionProc.running) { actionProc.running = false; root.busy = false }
    }
  }

  onOpenedChanged: if (opened) {
    reload()
    if (panelFlick) panelFlick.contentY = 0
    Qt.callLater(function () { keyCatcher.forceActiveFocus() })
  }

  // ---------- bar pill ----------

  WidgetButton {
    id: pill
    anchors.fill: parent
    bar: root.bar
    active: root.running
    fontSize: Style.font.caption
    // "" is fa-clock-o, from the Font Awesome range the stock widgets use.
    text: root.running && root.timeFormat !== "icon only"
            ? " " + root.pillClock(root.elapsed)
            : ""
    tooltipText: root.opened ? "" : (root.running
        ? (root.current ? root.current.description : "") + "\nLeft: panel  Right: stop"
        : (root.errorText !== "" ? root.errorText : "Toggl: stopped\nLeft: panel  Right: start last"))
    onPressed: function (button) {
      if (button === Qt.RightButton) root.toggleTimer()
      else if (button === Qt.MiddleButton) root.act(["omarchy-toggl", "sync"])
      else root.toggle()
    }
  }

  // ---------- popup ----------

  KeyboardPanel {
    id: panel
    anchorItem: pill
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(380))
    contentHeight: panel.fittedContentHeight(column.implicitHeight, Style.space(620))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      // Otherwise typing "s" in the new-entry field would toggle the timer.
      blocked: newEntry.activeFocus
      onCloseRequested: root.close()
      onTabRequested: function (direction) { root.switchPanel(direction) }
      onTextKey: function (t) {
        if (t === "s" || t === "S") root.toggleTimer()
        else if (t === "r" || t === "R") root.act(["omarchy-toggl", "sync"])
      }

      Flickable {
        id: panelFlick
        anchors.fill: parent
        contentWidth: width
        contentHeight: column.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        flickableDirection: Flickable.VerticalFlick
        interactive: contentHeight > height
        ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

        Column {
          id: column
          width: panelFlick.width
          spacing: Style.spacing.md

          // ----- hero: what's running now -----
          Item {
            id: header
            width: parent.width
            implicitHeight: hero.implicitHeight
            // Exposed for the hero's trailingControl, whose `root` resolves to
            // PanelHero rather than this Panel (see tailscale/Panel.qml:449).
            readonly property bool timerRunning: root.running
            readonly property bool actionBusy: root.busy
            readonly property color stopColor: root.urgent
            readonly property color playColor: root.foreground
            function fireToggle() { root.toggleTimer() }

            PanelHero {
              id: hero
              width: parent.width
              foreground: root.foreground
              fontFamily: root.fontFamily
              title: root.running ? root.leadLabel(root.current) : "No timer running"
              meta: root.running ? root.subLabel(root.current) : "Press S or pick a project"
              detail: root.running ? root.clockText(root.elapsed) : ""

              trailingControl: Component {
                PanelActionButton {
                  iconText: header.timerRunning ? "" : ""   // stop / play
                  tooltipText: header.timerRunning ? "Stop timer" : "Resume last entry"
                  foreground: header.timerRunning ? header.stopColor : header.playColor
                  fontFamily: hero.fontFamily
                  enabled: !header.actionBusy
                  onClicked: header.fireToggle()
                }
              }
            }
          }

          // ----- error / rate-limit banner -----
          Text {
            width: parent.width
            visible: root.errorText !== "" || root.cooldown > 0
            wrapMode: Text.WordWrap
            color: root.urgent
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            text: root.errorText !== ""
                    ? root.errorText
                    : "Rate limited by Toggl - live sync resumes in " + root.human(root.cooldown)
          }

          PanelSeparator { visible: root.ready; foreground: root.foreground }

          // ----- today -----
          Column {
            id: todaySection
            visible: root.ready && !!root.today
            width: parent.width
            spacing: Style.spacing.md
            readonly property var rows: root.today ? (root.today.by_project || []) : []
            readonly property real peak: {
              var m = 1
              for (var i = 0; i < rows.length; i++) m = Math.max(m, Number(rows[i].seconds || 0))
              return m
            }

            Item {
              width: parent.width
              implicitHeight: Math.max(todayHdr.implicitHeight, todayTotal.implicitHeight)
              PanelSectionHeader {
                id: todayHdr
                anchors.left: parent.left
                anchors.verticalCenter: parent.verticalCenter
                text: "TODAY"
                foreground: root.foreground
                fontFamily: root.fontFamily
              }
              Text {
                id: todayTotal
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter
                text: root.today ? root.today.label : ""
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                font.bold: true
              }
            }

            Repeater {
              model: todaySection.rows
              MeterRow {
                required property var modelData
                width: todaySection.width
                label: String(modelData.name || "")
                value: root.human(Number(modelData.seconds || 0))
                ratio: Number(modelData.seconds || 0) / todaySection.peak
                fill: root.projColor(modelData.color)
                emphasised: true
              }
            }

            Text {
              width: parent.width
              visible: todaySection.rows.length === 0
              text: "Nothing tracked today yet."
              color: root.dim
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
            }
          }

          PanelSeparator { visible: weekSection.visible; foreground: root.foreground }

          // ----- this week -----
          Column {
            id: weekSection
            visible: root.ready && !!root.week
            width: parent.width
            spacing: Style.spacing.md
            readonly property var days: root.week ? (root.week.by_day || []) : []
            readonly property real peak: {
              var m = 1
              for (var i = 0; i < days.length; i++) m = Math.max(m, Number(days[i].seconds || 0))
              return m
            }

            Item {
              width: parent.width
              implicitHeight: Math.max(weekHdr.implicitHeight, weekTotal.implicitHeight)
              PanelSectionHeader {
                id: weekHdr
                anchors.left: parent.left
                anchors.verticalCenter: parent.verticalCenter
                text: "THIS WEEK"
                foreground: root.foreground
                fontFamily: root.fontFamily
              }
              Text {
                id: weekTotal
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter
                text: root.week ? root.week.label : ""
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                font.bold: true
              }
            }

            Repeater {
              model: weekSection.days
              MeterRow {
                required property var modelData
                width: weekSection.width
                label: String(modelData.label || "")
                value: Number(modelData.seconds || 0) > 0 ? root.human(Number(modelData.seconds)) : "-"
                ratio: Number(modelData.seconds || 0) / weekSection.peak
                fill: modelData.today ? root.foreground : root.alpha(root.foreground, 0.55)
                emphasised: !!modelData.today
              }
            }
          }

          PanelSeparator { visible: recentSection.visible; foreground: root.foreground }

          // ----- recent, click to resume -----
          Column {
            id: recentSection
            visible: root.ready && root.recent.length > 0
            width: parent.width
            spacing: Style.spacing.xs

            PanelSectionHeader {
              width: parent.width
              text: "RECENT - CLICK TO START"
              foreground: root.foreground
              fontFamily: root.fontFamily
            }

            Repeater {
              model: root.recent
              RecentRow {
                required property var modelData
                required property int index
                width: recentSection.width
                entry: modelData
                idx: index
              }
            }
          }

          PanelSeparator { visible: root.ready; foreground: root.foreground }

          // ----- start something new -----
          Column {
            id: startSection
            visible: root.ready
            width: parent.width
            spacing: Style.spacing.md

            PanelSectionHeader {
              width: parent.width
              text: "START NEW"
              foreground: root.foreground
              fontFamily: root.fontFamily
            }

            TextField {
              id: newEntry
              width: parent.width
              foreground: root.foreground
              placeholderText: "What are you working on?"
              onAccepted: {
                root.startNamed(newEntry.text)
                newEntry.text = ""
              }
            }

            Text {
              width: parent.width
              text: root.projects.length > 0
                      ? "Enter starts with no project, or pick one below."
                      : "Enter to start. No projects found in this workspace."
              color: root.dim
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              wrapMode: Text.WordWrap
            }
          }

          // ----- projects -----
          Column {
            id: projectSection
            visible: root.ready && root.projects.length > 0
            width: parent.width
            spacing: Style.spacing.xs

            PanelSectionHeader {
              width: parent.width
              text: "PROJECTS"
              foreground: root.foreground
              fontFamily: root.fontFamily
            }

            // Wrapping grid: projects are short labels, so a flow of chips fits far
            // more per screen than one row each.
            Flow {
              width: parent.width
              spacing: Style.spacing.sm

              Repeater {
                model: root.projects
                ProjectChip {
                  required property var modelData
                  chipColor: root.projColor(modelData.color)
                  title: String(modelData.name || "")
                  onActivated: {
                    root.startProject(modelData.id, newEntry.text)
                    newEntry.text = ""
                  }
                }
              }
            }
          }

          // ----- tasks (only when the workspace has any) -----
          Column {
            id: taskSection
            visible: root.ready && root.tasks.length > 0
            width: parent.width
            spacing: Style.spacing.xs

            PanelSectionHeader {
              width: parent.width
              text: "TASKS"
              foreground: root.foreground
              fontFamily: root.fontFamily
            }

            Repeater {
              model: root.tasks
              PickRow {
                required property var modelData
                width: taskSection.width
                dotColor: root.dim
                title: String(modelData.name || "")
                trailing: modelData.project ? String(modelData.project) : ""
                onActivated: {
                  root.startTask(modelData.id, modelData.project_id, newEntry.text)
                  newEntry.text = ""
                }
              }
            }
          }
        }
      }
    }
  }

  // A label, a proportional meter, and a right-aligned value. Same shape the
  // agents panel uses for its per-day and per-model bars.
  component MeterRow: Item {
    id: meterRow
    property string label: ""
    property string value: ""
    property real ratio: 0
    property color fill: root.foreground
    property bool emphasised: false

    implicitHeight: Math.max(rowLabel.implicitHeight, rowValue.implicitHeight) + Style.spacing.sm

    Text {
      id: rowLabel
      text: meterRow.label
      color: meterRow.emphasised ? root.foreground : root.dim
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      font.bold: meterRow.emphasised
      elide: Text.ElideRight
      anchors.left: parent.left
      anchors.verticalCenter: parent.verticalCenter
      width: Style.space(74)
    }

    Rectangle {
      anchors.left: rowLabel.right
      anchors.right: rowValue.left
      anchors.leftMargin: Style.space(8)
      anchors.rightMargin: Style.space(10)
      anchors.verticalCenter: parent.verticalCenter
      height: Math.max(Style.space(4), Math.round(Style.spacing.controlHeight * 0.14))
      radius: height / 2
      color: root.track

      Rectangle {
        anchors.left: parent.left
        anchors.verticalCenter: parent.verticalCenter
        height: parent.height
        radius: parent.radius
        width: parent.width * root.clamp(meterRow.ratio, 0, 1)
        color: meterRow.fill
        Behavior on width { NumberAnimation { duration: 160; easing.type: Easing.OutCubic } }
      }
    }

    Text {
      id: rowValue
      text: meterRow.value
      color: meterRow.emphasised ? root.foreground : root.dim
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      font.bold: true
      horizontalAlignment: Text.AlignRight
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      width: Style.space(56)
    }
  }

  // A compact project chip for the wrapping grid.
  component ProjectChip: Rectangle {
    id: chip
    property color chipColor: root.dim
    property string title: ""
    signal activated()

    implicitWidth: chipDot.width + chipLabel.implicitWidth + Style.space(9) + Style.spacing.rowPaddingX * 2
    implicitHeight: Math.round(Style.spacing.controlHeight * 0.92)
    radius: Style.cornerRadius
    color: chipHover.containsMouse ? root.alpha(chip.chipColor, 0.28) : root.alpha(chip.chipColor, 0.12)
    border.width: 1
    border.color: chipHover.containsMouse ? root.alpha(chip.chipColor, 0.85) : root.alpha(chip.chipColor, 0.35)
    Behavior on color { ColorAnimation { duration: 60 } }

    Rectangle {
      id: chipDot
      width: Style.space(7); height: width; radius: width / 2
      color: chip.chipColor
      anchors.left: parent.left
      anchors.leftMargin: Style.spacing.rowPaddingX
      anchors.verticalCenter: parent.verticalCenter
    }

    Text {
      id: chipLabel
      anchors.left: chipDot.right
      anchors.leftMargin: Style.space(9)
      anchors.verticalCenter: parent.verticalCenter
      text: chip.title
      color: root.foreground
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
    }

    MouseArea {
      id: chipHover
      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: chip.activated()
    }
  }

  // A pickable row: colored dot, title, muted trailing label. Click activates.
  component PickRow: Rectangle {
    id: pickRow
    property color dotColor: root.dim
    property string title: ""
    property string trailing: ""
    signal activated()

    implicitHeight: Style.spacing.controlHeight
    radius: Style.cornerRadius
    color: pickHover.containsMouse ? root.track : "transparent"

    Rectangle {
      id: pickDot
      width: Style.space(7); height: width; radius: width / 2
      color: pickRow.dotColor
      anchors.left: parent.left
      anchors.leftMargin: Style.spacing.rowPaddingX
      anchors.verticalCenter: parent.verticalCenter
    }

    Text {
      anchors.left: pickDot.right
      anchors.leftMargin: Style.space(9)
      anchors.right: pickTrail.left
      anchors.rightMargin: Style.space(8)
      anchors.verticalCenter: parent.verticalCenter
      text: pickRow.title
      color: root.foreground
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
    }

    Text {
      id: pickTrail
      anchors.right: parent.right
      anchors.rightMargin: Style.spacing.rowPaddingX
      anchors.verticalCenter: parent.verticalCenter
      text: pickRow.trailing
      color: root.dim
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
    }

    MouseArea {
      id: pickHover
      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: pickRow.activated()
    }
  }

  // One recent entry: project dot, description, project name. Click starts it.
  component RecentRow: Rectangle {
    id: recentRow
    property var entry: null
    property int idx: 0

    implicitHeight: Style.spacing.controlHeight
    radius: Style.cornerRadius
    color: hover.containsMouse ? root.track : "transparent"

    Rectangle {
      id: dot
      width: Style.space(7); height: width; radius: width / 2
      color: root.projColor(recentRow.entry ? recentRow.entry.color : "")
      anchors.left: parent.left
      anchors.leftMargin: Style.spacing.rowPaddingX
      anchors.verticalCenter: parent.verticalCenter
    }

    Text {
      anchors.left: dot.right
      anchors.leftMargin: Style.space(9)
      anchors.right: projLabel.left
      anchors.rightMargin: Style.space(8)
      anchors.verticalCenter: parent.verticalCenter
      text: root.leadLabel(recentRow.entry)
      color: root.foreground
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
    }

    Text {
      id: projLabel
      anchors.right: parent.right
      anchors.rightMargin: Style.spacing.rowPaddingX
      anchors.verticalCenter: parent.verticalCenter
      text: root.subLabel(recentRow.entry)
      color: root.dim
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
    }

    MouseArea {
      id: hover
      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: root.resumeAt(recentRow.idx)
    }
  }
}
