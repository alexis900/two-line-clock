import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const MARKUP = (time, date) =>
    `<span font_size="11pt" weight="600">${time}</span>\n` +
    `<span font_size="8pt" alpha="75%">${date}</span>`;

export default class TwoLineClockExtension extends Extension {
    enable() {
        this._settings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
        this._formatSignal = this._settings.connect('changed::clock-format', () => this._tick(true));
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
        if (this._formatSignal) {
            this._settings.disconnect(this._formatSignal);
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

    _tick(force = false) {
        const now = GLib.DateTime.new_now_local();
        const is24h = this._settings.get_string('clock-format') === '24h';
        const time = now.format(is24h ? '%-H:%M' : '%-I:%M %p');
        const date = now.format('%d/%m/%Y');
        const markup = MARKUP(time, date);

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
