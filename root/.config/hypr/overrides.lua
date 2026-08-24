-- All personal Hyprland customization lives here, loaded last from hyprland.lua
-- so it overrides both Omarchy's defaults and the per-topic user files.

-- Bindings --------------------------------------------------------------------

-- SUPER+SHIFT+O is already Obsidian launch-or-focus by default, so no override.

-- Was: Signal
hl.unbind("SUPER + SHIFT + G")
o.bind("SUPER + SHIFT + G", "Telegram", { launch = "AyuGram", focus = "^AyuGram$" })

-- Was: Browser
hl.unbind("SUPER + SHIFT + RETURN")
o.bind("SUPER + SHIFT + RETURN", "Herdr",
  'setsid uwsm-app -- ghostty --working-directory="$(omarchy-cmd-terminal-cwd)" -e herdr')

-- Was: Herdr in the default terminal (foot), redundant with the binding above
hl.unbind("SUPER + CTRL + RETURN")
o.bind("SUPER + CTRL + RETURN", "Herdr (server)",
  'setsid uwsm-app -- ghostty -e herdr --remote omarz@77.42.4.14 --remote-keybindings server')

-- Captures
o.bind("F8", "Screenshot", "omarchy-capture-screenshot")
o.bind("ALT + F8", "Screenrecording", "omarchy-menu screenrecord")
o.bind("SUPER + F8", "Color picker", "pkill hyprpicker || hyprpicker -a")
o.bind("SUPER + CTRL + F8", "Extract text (OCR) from screenshot", "omarchy-capture-text-extraction")

-- Look and feel ---------------------------------------------------------------

hl.config({
  general = {
    gaps_in = 2,
    gaps_out = 2,
    border_size = 0,
  },

  decoration = {
    rounding = 10,
  },

  -- Don't steal focus when an app requests activation (e.g. notifications).
  misc = {
    focus_on_activate = false,
  },
})

-- Input -----------------------------------------------------------------------

hl.config({
  input = {
    -- Switch between layouts with Left Alt + Right Alt.
    kb_layout = "us,ara",
    kb_options = "compose:caps,grp:alts_toggle",

    repeat_rate = 40,
    repeat_delay = 600,

    numlock_by_default = true,

    touchpad = {
      scroll_factor = 0.4,

      -- Omarchy 4 turned this on, making right-click a two-finger click.
      -- false restores button areas: press the lower-right corner to right-click.
      clickfinger_behavior = false,
    },
  },
})

-- Environment -----------------------------------------------------------------

hl.env("OMARCHY_SCREENSHOT_DIR", (os.getenv("HOME") or "") .. "/Pictures/Screenshots")

-- Window rules ----------------------------------------------------------------

-- Assign apps to workspaces.
-- Check classes with: hyprctl clients | grep class | sort -u
o.window("chromium", { workspace = "3" })
o.window("obsidian", { workspace = "1" })
o.window("com.ayugram.desktop", { workspace = "2" })
