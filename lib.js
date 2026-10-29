// Pure formatting helpers shared by the extension and the tests.
// Keep this module free of GNOME Shell imports so it can run under plain gjs.

import GLib from 'gi://GLib';

export const WEIGHTS = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
};

export const DEFAULT_DATE_FORMAT = '%d/%m/%Y';

const COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const toInt = (value, fallback) => {
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, fallback, min, max) =>
    Math.min(max, Math.max(min, toInt(value, fallback)));

export const escape = text => GLib.markup_escape_text(`${text}`, -1);

// Pango markup accepts colour names and rgb() too, but only #rgb/#rrggbb
// values come from the preferences window. Rejecting anything else keeps a
// malformed setting from breaking the whole label.
export const normalizeColor = value => {
    if (typeof value !== 'string')
        return null;

    const color = value.trim();
    return COLOR_PATTERN.test(color) ? color : null;
};

export function formatTime(now, options = {}) {
    const {
        clockFormat = 'system',
        system24h = true,
        showSeconds = false,
    } = options;

    const is24h = clockFormat === 'system' ? system24h : clockFormat === '24h';

    if (is24h)
        return now.format(showSeconds ? '%-H:%M:%S' : '%-H:%M');

    return now.format(showSeconds ? '%-I:%M:%S %p' : '%-I:%M %p');
}

export function formatDate(now, dateFormat = DEFAULT_DATE_FORMAT) {
    // GLib.DateTime.format() returns null (it does not throw) for unknown
    // conversions such as %Q, so both cases need a fallback.
    let formatted = null;
    try {
        formatted = now.format(dateFormat);
    } catch {
        formatted = null;
    }

    if (formatted === null || formatted === '')
        formatted = now.format(DEFAULT_DATE_FORMAT);

    return formatted;
}

export function buildMarkup(now, options = {}) {
    const {
        clockFormat = 'system',
        system24h = true,
        showSeconds = false,
        timeSize = 11,
        timeWeight = 'semibold',
        timeColor = '',
        showDate = true,
        dateSize = 8,
        dateOpacity = 75,
        dateColor = '',
        dateFormat = DEFAULT_DATE_FORMAT,
    } = options;

    const time = formatTime(now, {clockFormat, system24h, showSeconds});
    const weight = WEIGHTS[timeWeight] ?? WEIGHTS.semibold;
    const size = clamp(timeSize, 11, 1, 72);
    const timeForeground = normalizeColor(timeColor);

    let markup = `<span font_size="${size}pt" weight="${weight}"` +
        `${timeForeground ? ` foreground="${timeForeground}"` : ''}>` +
        `${escape(time)}</span>`;

    if (showDate) {
        const date = formatDate(now, dateFormat);
        const dateSizeValue = clamp(dateSize, 8, 1, 72);
        const alpha = clamp(dateOpacity, 75, 0, 100);
        const dateForeground = normalizeColor(dateColor);

        markup += `\n<span font_size="${dateSizeValue}pt" alpha="${alpha}%"` +
            `${dateForeground ? ` foreground="${dateForeground}"` : ''}>` +
            `${escape(date)}</span>`;
    }

    return markup;
}

// Long date for the hover tooltip, independent of the configured format.
export function tooltipText(now) {
    return now.format('%A, %-d %B %Y');
}
