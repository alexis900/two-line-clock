# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.5] - 2026-10-29

### Added
- Presets in preferences: `Windows 11`, `Compact`, `Time only` and `Restore defaults`.
- Custom colors for the time and date lines (empty = theme color).
- Long date tooltip shown on hover.
- Date format presets: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD (ISO)`, `DD-MM-YYYY`, `YYYY/MM/DD`.
- Extracted pure formatting logic to `lib.js` with unit tests (`gjs -m tests/lib.test.js`).
- Spanish translations for all new strings.

### Changed
- Date format is now selected from a dropdown instead of a free text field.
- Schema extended with `time-color` and `date-color`.

## [1.4] - 2026-10-29

### Fixed
- Translations now load correctly in the preferences window even if the shell cached older metadata.
- Fixed `_()` calls at module scope breaking preferences loading.

## [1.3] - 2026-10-29

### Changed
- Switched to a single `St.Label` with Pango markup for both lines (fixes layout issues on GNOME 51).
- Added Dash to Panel support.
- Added About section with version and commit link.

## [1.2] - 2026-10-29

### Added
- Initial public release structure.
- Configurable sizes, weight, opacity, format and seconds.

[Unreleased]: https://github.com/alexis900/two-line-clock/compare/v1.4...HEAD
[1.5]: https://github.com/alexis900/two-line-clock/compare/v1.4...v1.5
[1.4]: https://github.com/alexis900/two-line-clock/releases/tag/v1.4
[1.3]: https://github.com/alexis900/two-line-clock/releases/tag/v1.3
[1.2]: https://github.com/alexis900/two-line-clock/releases/tag/v1.2
