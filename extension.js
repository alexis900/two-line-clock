import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.two-line-clock';

const WEIGHTS = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
};

const escape = text => GLib.markup_escape_text(text, -1);

export default class TwoLineClockExtension extends Extension {
    enable() {
        this._settings = this.getSettings(SCHEMA_ID);
        this._interface = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});

        this._settingsSignal = this._settings.connect('changed', () => this._tick(true));
        this._formatSignal = this._interface.connect('changed::clock-format', () => this._tick(true));

        this._labels = new Map();
        this._timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._tick();
            return GLib.SOURCE_CONTINUE;
        });
        this._tick(true);
    }

    disable() {
        if (this._timer) {
            GLib.source_remove(this._timer);
            this._timer = null;
        }
        if (this._settingsSignal) {
            this._settings.disconnect(this._settingsSignal);
            this._settingsSignal = null;
        }
        if (this._formatSignal) {
            this._interface.disconnect(this._formatSignal);
            this._formatSignal = null;
        }
        for (const [clockDisplay, data] of this._labels) {
            try {
                clockDisplay.show();
            } catch {
                // el panel pudo destruirse antes de desactivar
            }
            data.label.destroy();
        }
        this._labels.clear();
        this._labels = null;
        this._settings = null;
        this._interface = null;
    }

    _panels() {
        const panels = [Main.panel];
        try {
            if (global.dashToPanel?.panels)
                panels.push(...global.dashToPanel.panels.map(pw => pw.panel));
        } catch {
            // Dash to Panel no disponible: solo el panel principal
        }
        return panels;
    }

    _createLabel(clockDisplay) {
        const label = new St.Label({
            style_class: 'clock',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        label.clutter_text.y_align = Clutter.ActorAlign.CENTER;
        label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        clockDisplay.get_parent().insert_child_below(label, clockDisplay);
        clockDisplay.hide();

        const data = {label, markup: ''};
        this._labels.set(clockDisplay, data);
        return data;
    }

    _formatTime(now) {
        const format = this._settings.get_string('clock-format');
        const system24h = this._interface.get_string('clock-format') === '24h';
        const is24h = format === 'system' ? system24h : format === '24h';
        const seconds = this._settings.get_boolean('show-seconds');

        if (is24h)
            return now.format(seconds ? '%-H:%M:%S' : '%-H:%M');
        return now.format(seconds ? '%-I:%M:%S %p' : '%-I:%M %p');
    }

    _buildMarkup(now) {
        const time = this._formatTime(now);
        const timeSize = this._settings.get_int('time-font-size');
        const weight = WEIGHTS[this._settings.get_string('time-weight')] ?? 600;

        let markup = `<span font_size="${timeSize}pt" weight="${weight}">${escape(time)}</span>`;

        if (this._settings.get_boolean('show-date')) {
            const dateFormat = this._settings.get_string('date-format');
            let date;
            try {
                date = now.format(dateFormat);
            } catch {
                date = now.format('%d/%m/%Y');
            }

            const dateSize = this._settings.get_int('date-font-size');
            const opacity = this._settings.get_int('date-opacity');
            markup += `\n<span font_size="${dateSize}pt" alpha="${opacity}%">${escape(date)}</span>`;
        }

        return markup;
    }

    _tick(force = false) {
        const now = GLib.DateTime.new_now_local();
        const markup = this._buildMarkup(now);

        for (const panel of this._panels()) {
            const clockDisplay = panel.statusArea?.dateMenu?._clockDisplay;
            if (!clockDisplay)
                continue;

            try {
                let data = this._labels.get(clockDisplay);
                if (!data)
                    data = this._createLabel(clockDisplay);

                if (force || data.markup !== markup) {
                    data.label.clutter_text.set_markup(markup);
                    data.markup = markup;
                }
            } catch (e) {
                // Si algo falla, se mantiene el reloj original de GNOME
                logError(e, 'two-line-clock');
            }
        }
    }
}
