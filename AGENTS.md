# AGENTS.md

GNOME Shell extension (uuid `two-line-clock@alexis900.github.io`). GJS only: no
package manager, no test suite, no CI, no lint config. Keep it that way.

## Commands

- `./build.sh pack` → `dist/<uuid>.shell-extension.zip`. Compiles the GSettings
  schema and the `.po` catalogues and writes `build-info.json` (version, short
  commit, date) into the package.
- `./build.sh install` → same build into
  `~/.local/share/gnome-shell/extensions/<uuid>/`.
- `./build.sh enable | disable | uninstall | clean`.
- `make` and `node` are not installed; do not add a build system.
- Verification without a shell session:
  - `sh -n build.sh`
  - `glib-compile-schemas --strict --dry-run schemas`
  - `msgfmt -c -o /dev/null po/es.po`
  - `gjs -m extension.js` and `gjs -m prefs.js` fail with `ImportError` for
    `resource:///...` outside GNOME Shell (expected); only `SyntaxError` is a
    real failure.

## Hard-won constraints

- GNOME caches extension JS for the whole session and `ReloadExtension` is not
  implemented in GNOME 51. Edits to `extension.js` only take effect after
  logout/login; a new uuid or extension directory is also discovered only at
  login. `prefs.js` is read from disk each time the prefs window opens, so
  prefs-only changes need no restart.
- Never reintroduce two labels or a vertical `St.BoxLayout`. GNOME 51 removed
  the `vertical` property and `orientation: VERTICAL` did not apply reliably;
  both lines are one `St.Label` with Pango markup in `_buildMarkup()`. Keep
  escaping dynamic text with `GLib.markup_escape_text`.
- `build.sh` only calls `gnome-extensions` when `$HOME` is the real home
  (`have_session`). Do not remove that guard: it lets `install`/`uninstall` be
  tested with `HOME=/tmp/...` without disabling the running session.
- Generated and never committed: `dist/`, `schemas/gschemas.compiled`, `*.mo`,
  `locale/`.
- Schema id `org.gnome.shell.extensions.two-line-clock` (path
  `/org/gnome/shell/extensions/two-line-clock/`) must match `metadata.json`
  `settings-schema`. `getSettings()` reads `<extension>/schemas`, so the
  compiled schema must ship inside the zip/install.
- Integration: the extension hides `panel.statusArea.dateMenu._clockDisplay`
  and restores it in `disable()`; multi-monitor/Dash to Panel support comes from
  `global.dashToPanel.panels`. Keep the try/catch so GNOME's clock survives
  failures.

## i18n

- Source strings are English and live only in `prefs.js`, wrapped in `_()`.
  `po/es.po` has the Spanish translation. `metadata.json` name/description are
  not translatable.
- **Never call `_()` at module scope** (e.g. in top-level constants). The
  gettext wrapper locates the extension from the call stack and throws
  `Error: gettext can only be called from extensions`, which makes the prefs
  window fail to open. Build the choice arrays inside
  `fillPreferencesWindow()`.
- Call `this.initTranslations(GETTEXT_DOMAIN)` at the top of
  `fillPreferencesWindow()`. The prefs service receives the metadata the shell
  loaded **at login**; if that copy predates `gettext-domain`, the domain
  silently falls back to the UUID, the `.mo` is not found and the window shows
  English until a logout — even though `locale/es/...` is installed and correct.
- The version shown for the extension in GNOME's Extensions app also comes from
  that login-time metadata (stale after bumping `metadata.json`); the About row
  reads `build-info.json` from disk, so it is always current.
- After changing UI strings:
  `xgettext --language=JavaScript --from-code=UTF-8 --keyword=_ --package-name=two-line-clock -o po/two-line-clock.pot prefs.js`,
  then `msgmerge --update po/es.po po/two-line-clock.pot` and translate the new
  entries.
- `build.sh` compiles every `po/*.po` into
  `locale/<lang>/LC_MESSAGES/two-line-clock.mo`.

## Repo conventions

- Keep `README.md` (English) and `README.es.md` (Spanish) in sync. The user
  speaks Spanish and commit messages are written in Spanish.
- `metadata.json` `version` is an integer (currently 5); GitHub releases use
  `vX.Y` tags and are created manually with
  `gh release create vX.Y dist/<uuid>.shell-extension.zip`. Tag names are not
  derived from that integer, and tags only exist on the remote until
  `git fetch --tags`.
- Public repo `github.com/alexis900/two-line-clock`; `gh` is authenticated as
  `alexis900`.
