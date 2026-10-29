import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.two-line-clock';

const CLOCK_FORMATS = [
    ['system', _('System')],
    ['24h', _('24-hour')],
    ['12h', _('12-hour')],
];

const WEIGHTS = [
    ['normal', _('Normal')],
    ['medium', _('Medium')],
    ['semibold', _('Semibold')],
    ['bold', _('Bold')],
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

function addSpinRow(group, settings, key, title, subtitle, lower, upper) {    const row = new Adw.SpinRow({
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

export default class TwoLineClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings(SCHEMA_ID);
        const buildInfo = readBuildInfo(this.dir);

        window.search_enabled = true;

        const page = new Adw.PreferencesPage({
            title: _('Clock'),
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(page);

        const timeGroup = new Adw.PreferencesGroup({
            title: _('Time'),
            description: _('Appearance of the first line.'),
        });
        page.add(timeGroup);

        addComboRow(timeGroup, settings, 'clock-format', _('Format'),
            _('“System” follows the GNOME setting.'), CLOCK_FORMATS);

        addSpinRow(timeGroup, settings, 'time-font-size', _('Size'),
            _('In points.'), 6, 24);

        addComboRow(timeGroup, settings, 'time-weight', _('Weight'),
            _('Font weight.'), WEIGHTS);

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

        const formatRow = new Adw.EntryRow({
            title: _('Date format'),
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
            title: _('Syntax'),
            subtitle: _('%d day · %m month · %Y year · %H hour · %M minutes'),
            activatable: false,
        });
        dateGroup.add(formatHint);

        addSpinRow(dateGroup, settings, 'date-font-size', _('Size'),
            _('In points.'), 5, 18);

        addSpinRow(dateGroup, settings, 'date-opacity', _('Opacity'),
            _('Percentage.'), 20, 100);

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
