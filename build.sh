#!/bin/sh
# Empaqueta, instala y desinstala la extensión "Reloj en dos líneas".
# Uso: ./build.sh [pack|install|uninstall|enable|disable|clean]

set -eu

UUID="two-line-clock@alexis900.github.io"
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
        [ -f "$f" ] || { echo "Falta $f" >&2; exit 1; }
    done
    [ -d schemas ] || { echo "Falta el directorio schemas/" >&2; exit 1; }
    command -v glib-compile-schemas >/dev/null ||
        { echo "Falta glib-compile-schemas (paquete glib2-devel)" >&2; exit 1; }
}

# Solo se habla con GNOME Shell si HOME es el del usuario real; así se puede
# probar el script con un HOME temporal sin afectar a la sesión en uso.
have_session() {
    [ "$HOME" = "$(getent passwd "$(id -u)" | cut -d: -f6)" ]
}

shell_cmd() {
    if have_session; then
        "$@" 2>/dev/null || true
    fi
}

pack() {
    check
    rm -rf "$STAGE" "$ZIP"
    mkdir -p "$STAGE"
    cp $FILES "$STAGE/"
    cp -r schemas "$STAGE/"
    glib-compile-schemas "$STAGE/schemas"
    (cd "$STAGE" && zip -qr "../$UUID.shell-extension.zip" .)
    rm -rf "$STAGE"
    echo "Creado: $ZIP"
}

install() {
    pack
    rm -rf "$EXT_DIR"
    mkdir -p "$EXT_DIR"
    cp $FILES "$EXT_DIR/"
    cp -r schemas "$EXT_DIR/"
    glib-compile-schemas "$EXT_DIR/schemas"
    echo "Instalada en $EXT_DIR"
    echo "Actívala con: ./build.sh enable"
    echo "Si es la primera vez, cierra sesión y vuelve a entrar."
}

case "${1:-pack}" in
    pack)      pack ;;
    install)   install ;;
    enable)
        if have_session; then
            gnome-extensions enable "$UUID" 2>/dev/null ||
                echo "GNOME aún no conoce la extensión: cierra sesión y vuelve a entrar."
        else
            echo "HOME temporal: no se toca la sesión de GNOME."
        fi
        ;;
    disable)   shell_cmd gnome-extensions disable "$UUID" ;;
    uninstall)
        shell_cmd gnome-extensions disable "$UUID"
        rm -rf "$EXT_DIR"
        echo "Extensión eliminada de $EXT_DIR"
        ;;
    clean)     rm -rf "$DIST"; echo "Limpio." ;;
    *)         usage ;;
esac
