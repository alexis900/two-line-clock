import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.two-line-clock';

const CLOCK_FORMATS = [
    ['system', 'Sistema'],
    ['24h', '24 horas'],
    ['12h', '12 horas'],
];

const WEIGHTS = [
    ['normal', 'Normal'],
    ['medium', 'Media'],
    ['semibold', 'Seminegrita'],
    ['bold', 'Negrita'],
];

function addComboRow(group, settings, key, title, subtitle, choices) {
    const row = new Adw.ComboRow({
        title,
        subtitle,
        model: Gtk.StringList.new(choices.map(([, label]) => label)),
    });

    const sync = () => {
        const index = choices.findIndex(([value]) => value === settings.get_string(key));
        row.selected = index >= 0 ? index : 0;
    };

    sync();
    row.connect('notify::selected', () => {
        const choice = choices[row.selected];
        if (choice && settings.get_string(key) !== choice[0])
            settings.set_string(key, choice[0]);
    });
    settings.connect(`changed::${key}`, sync);

    group.add(row);
    return row;
}

function addSpinRow(group, settings, key, title, subtitle, lower, upper) {
    const row = new Adw.SpinRow({
        title,
        subtitle,
        adjustment: new Gtk.Adjustment({
            lower,
            upper,
            step_increment: 1,
            page_increment: 5,
            value: settings.get_int(key),
        }),
    });

    row.connect('notify::value', () => {
        const value = Math.round(row.value);
        if (settings.get_int(key) !== value)
            settings.set_int(key, value);
    });
    settings.connect(`changed::${key}`, () => {
        const value = settings.get_int(key);
        if (Math.round(row.value) !== value)
            row.value = value;
    });

    group.add(row);
    return row;
}

export default class TwoLineClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings(SCHEMA_ID);

        window.search_enabled = true;

        const page = new Adw.PreferencesPage({
            title: 'Reloj',
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(page);

        const timeGroup = new Adw.PreferencesGroup({
            title: 'Hora',
            description: 'Aspecto de la primera línea.',
        });
        page.add(timeGroup);

        addComboRow(timeGroup, settings, 'clock-format', 'Formato',
            '«Sistema» sigue el ajuste de GNOME.', CLOCK_FORMATS);

        addSpinRow(timeGroup, settings, 'time-font-size', 'Tamaño',
            'En puntos.', 6, 24);

        addComboRow(timeGroup, settings, 'time-weight', 'Grosor',
            'Peso de la fuente.', WEIGHTS);

        const secondsRow = new Adw.SwitchRow({
            title: 'Mostrar segundos',
            subtitle: 'Añade los segundos a la hora.',
        });
        settings.bind('show-seconds', secondsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        timeGroup.add(secondsRow);

        const dateGroup = new Adw.PreferencesGroup({
            title: 'Fecha',
            description: 'Aspecto de la segunda línea.',
        });
        page.add(dateGroup);

        const showDateRow = new Adw.SwitchRow({
            title: 'Mostrar la fecha',
            subtitle: 'Desactívalo para dejar solo la hora.',
        });
        settings.bind('show-date', showDateRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        dateGroup.add(showDateRow);

        const formatRow = new Adw.EntryRow({
            title: 'Formato de la fecha',
            text: settings.get_string('date-format'),
            show_apply_button: true,
        });
        formatRow.connect('apply', () => {
            settings.set_string('date-format', formatRow.text);
        });
        settings.connect('changed::date-format', () => {
            if (formatRow.text !== settings.get_string('date-format'))
                formatRow.text = settings.get_string('date-format');
        });
        dateGroup.add(formatRow);

        const formatHint = new Adw.ActionRow({
            title: 'Sintaxis',
            subtitle: '%d día · %m mes · %Y año · %H hora · %M minutos',
            activatable: false,
        });
        dateGroup.add(formatHint);

        addSpinRow(dateGroup, settings, 'date-font-size', 'Tamaño',
            'En puntos.', 5, 18);

        addSpinRow(dateGroup, settings, 'date-opacity', 'Opacidad',
            'Porcentaje.', 20, 100);

        const aboutGroup = new Adw.PreferencesGroup({title: 'Acerca de'});
        page.add(aboutGroup);

        const repoRow = new Adw.ActionRow({
            title: 'Repositorio',
            subtitle: 'github.com/alexis900/two-line-clock',
            activatable: true,
        });
        repoRow.add_suffix(new Gtk.Image({icon_name: 'adw-external-link-symbolic'}));
        repoRow.connect('activated', () => {
            Gtk.show_uri(window, 'https://github.com/alexis900/two-line-clock',
                Gdk.CURRENT_TIME);
        });
        aboutGroup.add(repoRow);
    }
}
