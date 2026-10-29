import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {buildMarkup, tooltipText} from './lib.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.two-line-clock';

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

        const data = {label, markup: '', tooltip: ''};
        this._labels.set(clockDisplay, data);
        return data;
    }

    _options() {
        return {
            clockFormat: this._settings.get_string('clock-format'),
            system24h: this._interface.get_string('clock-format') === '24h',
            showSeconds: this._settings.get_boolean('show-seconds'),
            timeSize: this._settings.get_int('time-font-size'),
            timeWeight: this._settings.get_string('time-weight'),
            timeColor: this._settings.get_string('time-color'),
            showDate: this._settings.get_boolean('show-date'),
            dateSize: this._settings.get_int('date-font-size'),
            dateOpacity: this._settings.get_int('date-opacity'),
            dateColor: this._settings.get_string('date-color'),
            dateFormat: this._settings.get_string('date-format'),
        };
    }

    _buildMarkup(now) {
        return buildMarkup(now, this._options());
    }

    _tick(force = false) {
        const now = GLib.DateTime.new_now_local();
        const markup = this._buildMarkup(now);
        const tooltip = tooltipText(now);

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

                if (force || data.tooltip !== tooltip) {
                    data.label.set_tooltip_text(tooltip);
                    data.tooltip = tooltip;
                }
            } catch (e) {
                // Si algo falla, se mantiene el reloj original de GNOME
                logError(e, 'two-line-clock');
            }
        }
    }
}
