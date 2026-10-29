#!/bin/sh
# Empaqueta, instala y desinstala la extensión "Reloj en dos líneas".
# Uso: ./build.sh [pack|install|uninstall|enable|disable|clean]

set -eu

UUID="reloj-dos-lineas@local"
DIST="dist"
ZIP="$DIST/$UUID.shell-extension.zip"
STAGE="$DIST/stage"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
FILES="metadata.json extension.js"

usage() {
    sed -n '2,3p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
}

check() {
    for f in $FILES; do
        [ -f "$f" ] || { echo "Falta $f" >&2; exit 1; }
    done
}

pack() {
    check
    rm -rf "$STAGE" "$ZIP"
    mkdir -p "$STAGE"
    cp $FILES "$STAGE/"
    (cd "$STAGE" && zip -qr "../$UUID.shell-extension.zip" .)
    rm -rf "$STAGE"
    echo "Creado: $ZIP"
}

install() {
    pack
    rm -rf "$EXT_DIR"
    mkdir -p "$EXT_DIR"
    cp $FILES "$EXT_DIR/"
    echo "Instalada en $EXT_DIR"
    echo "Actívala con: ./build.sh enable"
    echo "Si es la primera vez, cierra sesión y vuelve a entrar."
}

case "${1:-pack}" in
    pack)      pack ;;
    install)   install ;;
    enable)
        gnome-extensions enable "$UUID" 2>/dev/null ||
            echo "GNOME aún no conoce la extensión: cierra sesión y vuelve a entrar."
        ;;
    disable)   gnome-extensions disable "$UUID" 2>/dev/null || true ;;
    uninstall)
        gnome-extensions disable "$UUID" 2>/dev/null || true
        rm -rf "$EXT_DIR"
        echo "Extensión eliminada de $EXT_DIR"
        ;;
    clean)     rm -rf "$DIST"; echo "Limpio." ;;
    *)         usage ;;
esac
