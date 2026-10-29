#!/bin/sh
# Build and install the "Two-line clock" extension.
# Usage: ./build.sh [pack|install|uninstall|enable|disable|clean]

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

UUID="two-line-clock@alexis900.github.io"
DOMAIN="two-line-clock"
DIST="dist"
ZIP="$DIST/$UUID.shell-extension.zip"
STAGE="$DIST/stage"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
FILES="metadata.json extension.js prefs.js"

usage() {
    sed -n '2,3p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
}

check() {
    for f in $FILES; do
        [ -f "$f" ] || { echo "Missing $f" >&2; exit 1; }
    done
    [ -d schemas ] || { echo "Missing schemas/ directory" >&2; exit 1; }
    command -v glib-compile-schemas >/dev/null ||
        { echo "Missing glib-compile-schemas (package glib2-devel)" >&2; exit 1; }
    glib-compile-schemas --strict --dry-run schemas ||
        { echo "Invalid GSettings schema" >&2; exit 1; }
    if ls po/*.po >/dev/null 2>&1; then
        command -v msgfmt >/dev/null ||
            { echo "Missing msgfmt (package gettext)" >&2; exit 1; }
    fi
}

# Only talk to GNOME Shell when HOME is the real user's home, so the script can
# be tested with a temporary HOME without touching the running session.
have_session() {
    [ "$HOME" = "$(getent passwd "$(id -u)" | cut -d: -f6)" ]
}

shell_cmd() {
    if have_session; then
        "$@" 2>/dev/null || true
    fi
}

# Copy the files into $1, without compiling anything.
build_tree() {
    dest="$1"
    rm -rf "$dest"
    mkdir -p "$dest"
    cp $FILES "$dest/"
    cp -r schemas "$dest/"

    version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' metadata.json | head -n1)
    commit=$(git rev-parse --short HEAD 2>/dev/null || true)
    [ -n "$commit" ] || commit=unknown
    date=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    cat > "$dest/build-info.json" <<EOF
{
  "version": ${version:-0},
  "commit": "$commit",
  "date": "$date"
}
EOF

    if ls po/*.po >/dev/null 2>&1; then
        for po in po/*.po; do
            lang=${po##*/}
            lang=${lang%.po}
            mkdir -p "$dest/locale/$lang/LC_MESSAGES"
            msgfmt -c -o "$dest/locale/$lang/LC_MESSAGES/$DOMAIN.mo" "$po"
        done
    fi
}

pack() {
    check
    rm -rf "$STAGE" "$ZIP"
    build_tree "$STAGE"
    (cd "$STAGE" && zip -qr "../$UUID.shell-extension.zip" .)
    rm -rf "$STAGE"
    echo "Created: $ZIP"
}

install() {
    check
    build_tree "$EXT_DIR"
    # Only for the local copy: the zip must ship the .gschema.xml alone, because
    # GNOME Shell 45+ and `gnome-extensions install` compile it themselves.
    glib-compile-schemas "$EXT_DIR/schemas"
    echo "Installed in $EXT_DIR"
    echo "Enable it with: ./build.sh enable"
    echo "On first install, log out and back in."
}

case "${1:-pack}" in
    pack)      pack ;;
    install)   install ;;
    enable)
        if have_session; then
            gnome-extensions enable "$UUID" 2>/dev/null ||
                echo "GNOME does not know the extension yet: log out and back in."
        else
            echo "Temporary HOME: not touching the GNOME session."
        fi
        ;;
    disable)   shell_cmd gnome-extensions disable "$UUID" ;;
    uninstall)
        shell_cmd gnome-extensions disable "$UUID"
        rm -rf "$EXT_DIR"
        echo "Extension removed from $EXT_DIR"
        ;;
    clean)     rm -rf "$DIST"; echo "Clean." ;;
    *)         usage ;;
esac
