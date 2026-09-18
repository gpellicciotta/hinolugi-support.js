import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  isValidPassword,
  validPasswordDescription,
  formatHumanDateTime,
  formatDetailedRelativeTime,
  MONTH_NAMES,
} from '../js/utils.mjs';

describe('escapeHtml', () => {
  test('escapes HTML-significant characters', () => {
    assert.equal(escapeHtml(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
  });

  test('returns an empty string for null or undefined', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });

  test('coerces non-string input to a string', () => {
    assert.equal(escapeHtml(42), '42');
  });
});

describe('isValidPassword', () => {
  test('rejects empty or short passwords', () => {
    assert.equal(isValidPassword(''), false);
    assert.equal(isValidPassword(null), false);
    assert.equal(isValidPassword('abcde'), false);
  });

  test('accepts passwords of at least 6 characters', () => {
    assert.equal(isValidPassword('abcdef'), true);
  });
});

describe('validPasswordDescription', () => {
  test('describes the password rule', () => {
    assert.equal(validPasswordDescription(), 'minimally 6 letters');
  });
});

describe('formatHumanDateTime', () => {
  test('MONTH_NAMES contains all 12 calendar months', () => {
    assert.equal(MONTH_NAMES.length, 12);
    assert.equal(MONTH_NAMES[0], 'January');
    assert.equal(MONTH_NAMES[11], 'December');
  });

  test('formats date-time with time by default', () => {
    const d = new Date(2026, 0, 15, 9, 8);
    assert.equal(formatHumanDateTime(d), '15 January 2026 at 09:08');
  });

  test('formats date-only when withTime is false', () => {
    const d = new Date(2026, 0, 15, 9, 8);
    assert.equal(formatHumanDateTime(d, false), '15 January 2026');
  });

  test('handles timestamp and ISO string inputs', () => {
    const d = new Date(2026, 5, 20, 14, 30);
    assert.equal(formatHumanDateTime(d.getTime()), '20 June 2026 at 14:30');
    assert.equal(formatHumanDateTime(d, false), '20 June 2026');
  });

  test('returns empty string for invalid, null, or undefined dates', () => {
    assert.equal(formatHumanDateTime(null), '');
    assert.equal(formatHumanDateTime(undefined), '');
    assert.equal(formatHumanDateTime('invalid-date'), '');
  });
});

describe('formatDetailedRelativeTime', () => {
  const base = new Date(2026, 0, 15, 12, 0, 0);

  test('returns just now for diff under 60 seconds or slight future drift', () => {
    const justBefore = new Date(base.getTime() - 30 * 1000);
    const justAfter = new Date(base.getTime() + 10 * 1000);
    assert.equal(formatDetailedRelativeTime(justBefore, base), 'just now');
    assert.equal(formatDetailedRelativeTime(justAfter, base), 'just now');
  });

  test('formats minutes ago correctly with singular and plural', () => {
    const oneMin = new Date(base.getTime() - 60 * 1000);
    const fiveMin = new Date(base.getTime() - 5 * 60 * 1000);
    assert.equal(formatDetailedRelativeTime(oneMin, base), '1 minute ago');
    assert.equal(formatDetailedRelativeTime(fiveMin, base), '5 minutes ago');
  });

  test('formats hours and minutes combinations', () => {
    const oneHour = new Date(base.getTime() - 3600 * 1000);
    const twoHours = new Date(base.getTime() - 2 * 3600 * 1000);
    const hoursAndMins = new Date(base.getTime() - (2 * 3600 + 15 * 60) * 1000);
    const hourAndOneMin = new Date(base.getTime() - (3600 + 60) * 1000);
    assert.equal(formatDetailedRelativeTime(oneHour, base), '1 hour ago');
    assert.equal(formatDetailedRelativeTime(twoHours, base), '2 hours ago');
    assert.equal(formatDetailedRelativeTime(hoursAndMins, base), '2 hours and 15 minutes ago');
    assert.equal(formatDetailedRelativeTime(hourAndOneMin, base), '1 hour and 1 minute ago');
  });

  test('formats days combinations with singular and plural', () => {
    const oneDay = new Date(base.getTime() - 86400 * 1000);
    const twoDays = new Date(base.getTime() - 2 * 86400 * 1000);
    const daysAndHours = new Date(base.getTime() - (2 * 86400 + 3 * 3600) * 1000);
    const daysAndMinutes = new Date(base.getTime() - (86400 + 10 * 60) * 1000);
    const fullComb = new Date(base.getTime() - (86400 + 2 * 3600 + 15 * 60) * 1000);
    assert.equal(formatDetailedRelativeTime(oneDay, base), '1 day ago');
    assert.equal(formatDetailedRelativeTime(twoDays, base), '2 days ago');
    assert.equal(formatDetailedRelativeTime(daysAndHours, base), '2 days and 3 hours ago');
    assert.equal(formatDetailedRelativeTime(daysAndMinutes, base), '1 day and 10 minutes ago');
    assert.equal(formatDetailedRelativeTime(fullComb, base), '1 day, 2 hours and 15 minutes ago');
  });

  test('returns empty string for null, undefined, or invalid dates', () => {
    assert.equal(formatDetailedRelativeTime(null, base), '');
    assert.equal(formatDetailedRelativeTime(undefined, base), '');
    assert.equal(formatDetailedRelativeTime('not-a-date', base), '');
  });
});
