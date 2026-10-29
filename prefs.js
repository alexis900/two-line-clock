import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.two-line-clock';
const GETTEXT_DOMAIN = 'two-line-clock';

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

function readBuildInfo(dir) {
    try {
        const file = dir.get_child('build-info.json');
        if (!file.query_exists(null))
            return {};

        const [, contents] = file.load_contents(null);
        return JSON.parse(new TextDecoder().decode(contents));
    } catch {
        return {};
    }
}

function applyValues(settings, values) {
    for (const [key, value] of Object.entries(values)) {
        if (typeof value === 'boolean')
            settings.set_boolean(key, value);
        else if (typeof value === 'number')
            settings.set_int(key, value);
        else
            settings.set_string(key, value);
    }
}

function parseColor(value) {
    const rgba = new Gdk.RGBA();
    if (value && rgba.parse(value))
        return rgba;

    rgba.parse('#ffffff');
    return rgba;
}

function colorToHex(rgba) {
    const channel = value => Math.round(Math.min(1, Math.max(0, value)) * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${channel(rgba.red)}${channel(rgba.green)}${channel(rgba.blue)}`;
}

// The setting holds #rrggbb, and an empty string means "use the theme color".
// A switch row keeps that state explicit instead of adding a second key.
function addColorRow(group, settings, key, title, subtitle) {
    const row = new Adw.SwitchRow({title, subtitle});
    const button = new Gtk.ColorDialogButton({
        dialog: new Gtk.ColorDialog({title, with_alpha: false}),
        valign: Gtk.Align.CENTER,
    });
    row.add_suffix(button);

    let syncing = false;

    const sync = () => {
        syncing = true;
        const value = settings.get_string(key);
        row.active = value !== '';
        button.sensitive = row.active;
        button.rgba = parseColor(value);
        syncing = false;
    };

    row.connect('notify::active', () => {
        if (syncing)
            return;

        if (row.active) {
            const hex = colorToHex(button.rgba);
            if (settings.get_string(key) !== hex)
                settings.set_string(key, hex);
        } else if (settings.get_string(key) !== '') {
            settings.set_string(key, '');
        }
    });

    button.connect('notify::rgba', () => {
        if (syncing || !row.active)
            return;

        const hex = colorToHex(button.rgba);
        if (settings.get_string(key) !== hex)
            settings.set_string(key, hex);
    });

    settings.connect(`changed::${key}`, sync);
    sync();
    group.add(row);
    return row;
}

export default class TwoLineClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // The prefs service builds this object from the metadata the shell
        // loaded at login. If that copy predates `gettext-domain`, the domain
        // falls back to the UUID and the translations in locale/ never load,
        // until the next logout/login. Rebinding here avoids that.
        this.initTranslations(GETTEXT_DOMAIN);

        const settings = this.getSettings(SCHEMA_ID);
        const buildInfo = readBuildInfo(this.dir);

        // gettext must not be called at module scope: the wrapper can only
        // resolve the extension once GNOME has loaded it, so translate here.
        const clockFormats = [
            ['system', _('System')],
            ['24h', _('24-hour')],
            ['12h', _('12-hour')],
        ];
        const weights = [
            ['normal', _('Normal')],
            ['medium', _('Medium')],
            ['semibold', _('Semibold')],
            ['bold', _('Bold')],
        ];

        window.search_enabled = true;

        const page = new Adw.PreferencesPage({
            title: _('Clock'),
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(page);

        const presetGroup = new Adw.PreferencesGroup({
            title: _('Presets'),
            description: _('Apply a combination of settings at once.'),
        });
        page.add(presetGroup);

        const presets = [
            {
                title: _('Windows 11'),
                subtitle: _('14 pt time, 9 pt date, semibold.'),
                values: {
                    'clock-format': 'system',
                    'show-seconds': false,
                    'time-font-size': 14,
                    'time-weight': 'semibold',
                    'time-color': '',
                    'show-date': true,
                    'date-font-size': 9,
                    'date-opacity': 90,
                    'date-color': '',
                    'date-format': '%d/%m/%Y',
                },
            },
            {
                title: _('Compact'),
                subtitle: _('10 pt time, 7 pt date, medium weight.'),
                values: {
                    'time-font-size': 10,
                    'time-weight': 'medium',
                    'time-color': '',
                    'show-date': true,
                    'date-font-size': 7,
                    'date-opacity': 70,
                    'date-color': '',
                },
            },
            {
                title: _('Time only'),
                subtitle: _('Hides the date and enlarges the time.'),
                values: {
                    'show-seconds': false,
                    'time-font-size': 13,
                    'time-weight': 'semibold',
                    'show-date': false,
                },
            },
        ];

        for (const preset of presets) {
            const row = new Adw.ActionRow({
                title: preset.title,
                subtitle: preset.subtitle,
                activatable: true,
            });
            const apply = new Gtk.Button({
                label: _('Apply'),
                valign: Gtk.Align.CENTER,
            });
            apply.add_css_class('flat');

            const activate = () => {
                applyValues(settings, preset.values);
                window.add_toast(new Adw.Toast({title: _('Preset applied')}));
            };

            apply.connect('clicked', activate);
            row.connect('activated', activate);
            row.add_suffix(apply);
            presetGroup.add(row);
        }

        const resetRow = new Adw.ActionRow({
            title: _('Restore defaults'),
            subtitle: _('Resets every option to its default value.'),
            activatable: true,
        });
        const reset = new Gtk.Button({
            label: _('Reset'),
            valign: Gtk.Align.CENTER,
        });
        reset.add_css_class('flat');

        const resetAll = () => {
            for (const key of settings.settings_schema.list_keys())
                settings.reset(key);
            window.add_toast(new Adw.Toast({title: _('Settings reset')}));
        };

        reset.connect('clicked', resetAll);
        resetRow.connect('activated', resetAll);
        resetRow.add_suffix(reset);
        presetGroup.add(resetRow);

        const timeGroup = new Adw.PreferencesGroup({
            title: _('Time'),
            description: _('Appearance of the first line.'),
        });
        page.add(timeGroup);

        addComboRow(timeGroup, settings, 'clock-format', _('Format'),
            _('“System” follows the GNOME setting.'), clockFormats);

        addSpinRow(timeGroup, settings, 'time-font-size', _('Size'),
            _('In points.'), 6, 24);

        addComboRow(timeGroup, settings, 'time-weight', _('Weight'),
            _('Font weight.'), weights);

        addColorRow(timeGroup, settings, 'time-color', _('Color'),
            _('Overrides the theme color.'));

        const secondsRow = new Adw.SwitchRow({
            title: _('Show seconds'),
            subtitle: _('Adds seconds to the time.'),
        });
        settings.bind('show-seconds', secondsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        timeGroup.add(secondsRow);

        const dateGroup = new Adw.PreferencesGroup({
            title: _('Date'),
            description: _('Appearance of the second line.'),
        });
        page.add(dateGroup);

        const showDateRow = new Adw.SwitchRow({
            title: _('Show date'),
            subtitle: _('Turn off to show only the time.'),
        });
        settings.bind('show-date', showDateRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        dateGroup.add(showDateRow);

        const dateFormatChoices = [
            ['%d/%m/%Y', _('DD/MM/YYYY')],
            ['%m/%d/%Y', _('MM/DD/YYYY')],
            ['%Y-%m-%d', _('YYYY-MM-DD (ISO)')],
            ['%d-%m-%Y', _('DD-MM-YYYY')],
            ['%Y/%m/%d', _('YYYY/MM/DD')],
        ];

        const dateFormatRow = new Adw.ComboRow({
            title: _('Date format'),
            subtitle: _('Choose a preset format.'),
            model: Gtk.StringList.new(dateFormatChoices.map(([, label]) => label)),
        });

        const syncDateFormat = () => {
            const value = settings.get_string('date-format');
            if (dateFormatChoices.some(([fmt]) => fmt === value)) {
                const index = dateFormatChoices.findIndex(([fmt]) => fmt === value);
                dateFormatRow.selected = index >= 0 ? index : 0;
                return;
            }
            // Valores personalizados (compatibles con versiones anteriores)
            dateFormatRow.selected = dateFormatChoices.length - 1 >= 0 ? 0 : 0;
        };

        syncDateFormat();
        dateFormatRow.connect('notify::selected', () => {
            const choice = dateFormatChoices[dateFormatRow.selected];
            if (choice && settings.get_string('date-format') !== choice[0])
                settings.set_string('date-format', choice[0]);
        });
        settings.connect('changed::date-format', syncDateFormat);
        dateGroup.add(dateFormatRow);

        addSpinRow(dateGroup, settings, 'date-font-size', _('Size'),
            _('In points.'), 5, 18);
            _('In points.'), 5, 18);

        addSpinRow(dateGroup, settings, 'date-opacity', _('Opacity'),
            _('Percentage.'), 20, 100);

        addColorRow(dateGroup, settings, 'date-color', _('Color'),
            _('Overrides the theme color.'));

        const aboutGroup = new Adw.PreferencesGroup({title: _('About')});
        page.add(aboutGroup);

        aboutGroup.add(new Adw.ActionRow({
            title: _('Version'),
            subtitle: `${buildInfo.version ?? this.metadata.version ?? '—'}`,
            activatable: false,
        }));

        const commit = buildInfo.commit;
        const commitRow = new Adw.ActionRow({
            title: _('Commit'),
            subtitle: commit || _('Unknown'),
            activatable: Boolean(commit),
        });
        if (commit) {
            commitRow.add_suffix(new Gtk.Image({icon_name: 'adw-external-link-symbolic'}));
            commitRow.connect('activated', () => {
                Gtk.show_uri(window,
                    `https://github.com/alexis900/two-line-clock/commit/${commit}`,
                    Gdk.CURRENT_TIME);
            });
        }
        aboutGroup.add(commitRow);

        const repoRow = new Adw.ActionRow({
            title: _('Repository'),
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
