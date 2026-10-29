// Unit tests for lib.js. Run with: gjs -m tests/lib.test.js

import GLib from 'gi://GLib';
import system from 'system';

import {
    buildMarkup,
    formatDate,
    formatTime,
    normalizeColor,
    tooltipText,
} from '../lib.js';

const date = GLib.DateTime.new_local(2026, 10, 29, 14, 37, 5);

let failures = 0;

function test(name, callback) {
    try {
        callback();
        print(`ok - ${name}`);
    } catch (error) {
        failures += 1;
        print(`not ok - ${name}`);
        print(`  ${error.message}`);
    }
}

function equal(actual, expected, label = '') {
    if (actual !== expected) {
        throw new Error(
            `${label ? `${label}: ` : ''}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function includes(text, fragment, label = '') {
    if (!text.includes(fragment))
        throw new Error(`${label ? `${label}: ` : ''}missing ${JSON.stringify(fragment)} in ${JSON.stringify(text)}`);
}

function excludes(text, fragment, label = '') {
    if (text.includes(fragment))
        throw new Error(`${label ? `${label}: ` : ''}unexpected ${JSON.stringify(fragment)} in ${JSON.stringify(text)}`);
}

test('24-hour time', () => {
    equal(formatTime(date, {clockFormat: '24h'}), '14:37');
});

test('24-hour time with seconds', () => {
    equal(formatTime(date, {clockFormat: '24h', showSeconds: true}), '14:37:05');
});

test('12-hour time', () => {
    const time = formatTime(date, {clockFormat: '12h'});
    includes(time, '2:37');
    if (!/[ap]\.?\s?m\.?/i.test(time))
        throw new Error(`missing AM/PM marker in ${JSON.stringify(time)}`);
});

test('system format follows the interface setting', () => {
    equal(formatTime(date, {clockFormat: 'system', system24h: true}), '14:37');
    includes(formatTime(date, {clockFormat: 'system', system24h: false}), '2:37');
});

test('invalid date format falls back to the default', () => {
    equal(formatDate(date, '%Q'), '29/10/2026');
});

test('default markup has two lines', () => {
    const markup = buildMarkup(date);
    includes(markup, 'font_size="11pt"');
    includes(markup, 'weight="600"');
    includes(markup, '29/10/2026');
    equal(markup.split('\n').length, 2);
});

test('date can be hidden', () => {
    const markup = buildMarkup(date, {showDate: false});
    excludes(markup, '\n');
    excludes(markup, '29/10/2026');
});

test('date text is escaped for markup', () => {
    const markup = buildMarkup(date, {dateFormat: '%d & %m'});
    includes(markup, '29 &amp; 10');
    excludes(markup, '29 & 10');
});

test('colours are validated', () => {
    equal(normalizeColor('#ff8800'), '#ff8800');
    equal(normalizeColor('#abc'), '#abc');
    equal(normalizeColor('red'), null);
    equal(normalizeColor('#ff8800" weight="1'), null);
    equal(normalizeColor(''), null);
});

test('valid colours reach the markup', () => {
    const markup = buildMarkup(date, {timeColor: '#ff8800', dateColor: '#00ff00'});
    includes(markup, 'foreground="#ff8800"');
    includes(markup, 'foreground="#00ff00"');
});

test('invalid colours are ignored', () => {
    const markup = buildMarkup(date, {timeColor: 'red', dateColor: '"><b>'});
    excludes(markup, 'foreground=');
});

test('sizes and opacity are clamped', () => {
    includes(buildMarkup(date, {timeSize: 999}), 'font_size="72pt"');
    includes(buildMarkup(date, {timeSize: -5}), 'font_size="1pt"');
    includes(buildMarkup(date, {dateOpacity: 250}), 'alpha="100%"');
    includes(buildMarkup(date, {dateOpacity: -20}), 'alpha="0%"');
});

test('tooltip shows the long date', () => {
    const tooltip = tooltipText(date);
    includes(tooltip, '2026');
    includes(tooltip, '29');
});

if (failures > 0) {
    print(`\n${failures} test(s) failed`);
    system.exit(1);
}

print('\nAll tests passed');
