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
- Respeta el formato de 12/24 h configurado en el sistema.
- Al hacer clic se sigue abriendo el calendario de GNOME.
- Compatible con el panel estándar de GNOME y con
  [Dash to Panel](https://extensions.gnome.org/extension/1160/dash-to-panel/)
  (incluidos varios monitores).
- Si algo falla, el reloj original de GNOME se mantiene visible: la extensión
  solo lo oculta mientras funciona correctamente.

## Requisitos

- GNOME Shell 46 – 51.
- No necesita dependencias adicionales.

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
./build.sh enable    # o: gnome-extensions enable reloj-dos-lineas@local
```

**Cierra sesión y vuelve a entrar** la primera vez. Las actualizaciones
posteriores del código también requieren reiniciar la sesión: GNOME cachea el
JavaScript de las extensiones y `ReloadExtension` no está implementado en GNOME
51.

### Instalación manual

```bash
./build.sh pack
gnome-extensions install --force dist/reloj-dos-lineas@local.shell-extension.zip
```

## Desinstalación

```bash
./build.sh uninstall
```

## Ajustes

Los tamaños y la opacidad se definen al principio de `extension.js`:

```js
const MARKUP = (time, date) =>
    `<span font_size="11pt" weight="600">${time}</span>\n` +
    `<span font_size="8pt" alpha="75%">${date}</span>`;
```

Cambia `11pt`, `8pt` y `75%` a tu gusto. Ten en cuenta que el panel debe tener
altura suficiente para las dos líneas (40 px funcionan bien).

La fecha usa el formato `dd/mm/yyyy`. Para cambiarlo, edita esta línea en
`_tick()`:

```js
const date = now.format('%d/%m/%Y');
```

## Estructura

```
extension.js    Código de la extensión
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
