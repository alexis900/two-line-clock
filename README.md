# Reloj en dos líneas

Extensión para GNOME Shell que muestra la **hora y la fecha en dos líneas** en el
panel, con el estilo del reloj de Windows 11:

```
14:01
29/10/2026
```

La hora va más grande y en seminegrita; la fecha, más pequeña y atenuada.

## Características

- Dos líneas reales en una sola etiqueta (sin contenedores que puedan romper el
  diseño en distintas versiones de GNOME).
- **Ventana de preferencias**: tamaños, grosor, opacidad, formato de fecha,
  segundos y formato horario, sin tocar código.
- Respeta el formato de 12/24 h configurado en el sistema (o se puede forzar).
- Al hacer clic se sigue abriendo el calendario de GNOME.
- Compatible con el panel estándar de GNOME y con
  [Dash to Panel](https://extensions.gnome.org/extension/1160/dash-to-panel/)
  (incluidos varios monitores).
- Si algo falla, el reloj original de GNOME se mantiene visible: la extensión
  solo lo oculta mientras funciona correctamente.

## Requisitos

- GNOME Shell 46 – 51.
- En tiempo de ejecución no necesita dependencias adicionales.
- Para compilar/instalar desde el código: `glib-compile-schemas` (paquete
  `glib2-devel` en Fedora). El zip de la release ya lo incluye compilado.

## Instalación

### Desde el repositorio

```bash
git clone https://github.com/alexis900/two-line-clock.git
cd two-line-clock
./build.sh install
```

La primera vez que se instala, GNOME Shell no descubre la extensión hasta el
siguiente inicio de sesión. Después:

```bash
./build.sh enable    # o: gnome-extensions enable two-line-clock@alexis900.github.io
```

**Cierra sesión y vuelve a entrar** la primera vez. Las actualizaciones
posteriores del código también requieren reiniciar la sesión: GNOME cachea el
JavaScript de las extensiones y `ReloadExtension` no está implementado en GNOME
51.

### Instalación manual

```bash
./build.sh pack
gnome-extensions install --force dist/two-line-clock@alexis900.github.io.shell-extension.zip
```

### Desde la release (sin git)

Descarga el `.zip` de la última
[release](https://github.com/alexis900/two-line-clock/releases/latest) y ejecuta:

```bash
gnome-extensions install --force two-line-clock@alexis900.github.io.shell-extension.zip
```

## Desinstalación

```bash
./build.sh uninstall
```

## Ajustes

Abre la ventana de preferencias de la extensión:

```bash
gnome-extensions prefs two-line-clock@alexis900.github.io
```

O desde la aplicación **Extensiones** de GNOME, botón de configuración de
«Reloj en dos líneas». Desde ahí puedes cambiar:

| Ajuste | Por defecto |
| --- | --- |
| Formato del reloj (sistema / 24 h / 12 h) | sistema |
| Mostrar segundos | no |
| Tamaño de la hora | 11 pt |
| Grosor de la hora | seminegrita |
| Mostrar la fecha | sí |
| Formato de la fecha | `%d/%m/%Y` |
| Tamaño de la fecha | 8 pt |
| Opacidad de la fecha | 75 % |

El formato de fecha sigue la sintaxis de
[GLib.DateTime.format](https://docs.gtk.org/glib/method.DateTime.format.html):
`%d` día, `%m` mes, `%Y` año, `%H` hora, `%M` minutos, `%A` día de la semana.

Los valores también se pueden cambiar por línea de comandos:

```bash
gsettings --schemadir ~/.local/share/gnome-shell/extensions/two-line-clock@alexis900.github.io/schemas \
  set org.gnome.shell.extensions.two-line-clock time-font-size 12
```

Ten en cuenta que el panel debe tener altura suficiente para las dos líneas
(40 px funcionan bien).

## Estructura

```
extension.js    Código de la extensión
prefs.js        Ventana de preferencias
schemas/        Esquema GSettings con los ajustes
metadata.json   Metadatos (uuid, versiones de GNOME compatibles)
build.sh        Empaquetado, instalación y desinstalación
```

## Notas de compatibilidad

- **GNOME 51**: `St.BoxLayout` ya no acepta la propiedad `vertical`; la
  orientación vertical de un `St.BoxLayout` tampoco se aplicó de forma fiable,
  por eso las dos líneas se dibujan con Pango dentro de un único `St.Label`.
- El tamaño del panel no lo controla esta extensión. Con Dash to Panel, la
  altura se ajusta con `panel-size` y hay que vaciar `panel-sizes` si existe un
  valor por monitor que la anule.

## Licencia

GPL-2.0-or-later. Consulta [LICENSE](LICENSE).
