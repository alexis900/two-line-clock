# Roadmap

This roadmap is a living document. Priorities may change depending on GNOME Shell updates, reviewer feedback on extensions.gnome.org, or user requests.

## Current status
- **extensions.gnome.org**: v4 in review
- **GitHub**: v1.5 released, CI green, translations (es, fr, de, pt_BR)
- **Local**: v8 installed and working

## Near term (after approval on eGO)

### UI & preferences
- [ ] **Custom date format**: add a toggle "Use custom format" to reveal an `Adw.EntryRow` for advanced GLib.DateTime syntax (keep the preset dropdown for most users).
- [ ] **More presets**: add "Minimal" and "Bold" presets to cover common layouts.
- [ ] **Line spacing**: add a small "Line spacing" control to fine-tune the gap between time and date for a closer Windows 11 look.
- [ ] **Panel height adaptation**: option to auto-scale font sizes based on panel height (useful with different panel sizes/Dash to Panel).

### Functionality
- [ ] **Weekday in date**: optional short/long weekday (e.g. `Mon` or `Lunes`).
- [ ] **Calendar tooltip improvements**: richer tooltip or respect locale formatting better.
- [ ] **Right-click menu**: quick access to preferences/calendar without going through the app grid.

## Mid term

### Styling & integration
- [ ] **Per-monitor styles**: allow different sizes/colors on different monitors.
- [ ] **Quick Settings integration**: optional toggle/indicator in Quick Settings (GNOME 43+).
- [ ] **Accent color support**: use `accent-color` from GNOME 47+ where available, with fallback to user color.

### Quality
- [ ] **More tests**: extend `tests/lib.test.js` with markup escaping, color validation edge cases and tooltip formatting.
- [ ] **TypeScript definitions**: add optional `types/` with JSDoc + `d.ts` for better editor support (without adding a build step).
- [ ] **Accessibility**: review label roles and ensure screen readers get sensible text.

## Long term

- [ ] **Themes/presets sharing**: export/import presets as JSON.
- [ ] **Dynamic format**: switch format based on space available (shrink/ellipsize gracefully).
- [ ] **Official translation platform**: consider Weblate/Crowdin once there's steady interest.
- [ ] **Desktop shell parity**: test on upcoming GNOME versions as they land.

## Ideas to consider
- [ ] **Clock click behavior**: configurable action (calendar, notifications, custom command).
- [ ] **Seconds in different styles**: subtle seconds without enlarging the whole line.
- [ ] **Battery/indicator friendly**: ensure it doesn't clash with crowded panels.

## Done
- [x] Two-line clock with single `St.Label` + Pango markup (GNOME 51 compatible)
- [x] Dash to Panel support
- [x] Preferences with presets, custom colors, date format presets
- [x] Tooltip with long date
- [x] Spanish/French/German/Brazilian Portuguese translations
- [x] Unit tests for formatting logic
- [x] CI with validation + releases
- [x] Published to GitHub releases (v1.5)
- [x] Submitted to extensions.gnome.org (v4 in review)

## Contributing
Feel free to open an issue on [GitHub](https://github.com/alexis900/two-line-clock/issues) with ideas or bug reports. Pull requests are welcome as long as they follow the guidelines in `AGENTS.md`.
