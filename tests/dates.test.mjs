import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  date,
  today,
  tomorrow,
  yesterday,
  dateAfterDays,
  daysBetween,
  daysDiff,
  weeksDiff,
  monthsDiff,
  yearsDiff,
  startOfDay,
  endOfDay,
  easterDay,
  toDateTime,
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeDateTime,
  formatTimespan,
  MONTH_NAMES,
  formatHumanDateTime,
  formatDetailedRelativeTime,
  randomDate,
  toWireDate,
  fromWireDate,
  parseDate,
} from '../js/dates.mjs';

describe('dates', () => {
  describe('MONTH_NAMES and human formatters', () => {
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

    test('returns empty string for invalid, null, or undefined dates', () => {
      assert.equal(formatHumanDateTime(null), '');
      assert.equal(formatHumanDateTime(undefined), '');
      assert.equal(formatHumanDateTime('invalid-date'), '');
    });

    test('formatDetailedRelativeTime formats minutes, hours, days', () => {
      const now = new Date(2026, 0, 15, 12, 0, 0);
      const justNow = new Date(2026, 0, 15, 11, 59, 30);
      assert.equal(formatDetailedRelativeTime(justNow, now), 'just now');

      const minutesAgo = new Date(2026, 0, 15, 11, 45, 0);
      assert.equal(formatDetailedRelativeTime(minutesAgo, now), '15 minutes ago');

      const hoursAgo = new Date(2026, 0, 15, 10, 0, 0);
      assert.equal(formatDetailedRelativeTime(hoursAgo, now), '2 hours ago');

      const daysAgo = new Date(2026, 0, 13, 12, 0, 0);
      assert.equal(formatDetailedRelativeTime(daysAgo, now), '2 days ago');
    });
  });

  describe('creation and arithmetic', () => {
    test('date creates dates from strings, numbers, or parts', () => {
      const d1 = date(2026, 9, 19);
      assert.equal(d1.getFullYear(), 2026);
      assert.equal(d1.getMonth(), 8); // 0-indexed September
      assert.equal(d1.getDate(), 19);

      const d2 = date('2026-09-19');
      assert.equal(d2.getFullYear(), 2026);
    });

    test('relative day generators', () => {
      assert.ok(today() instanceof Date);
      assert.ok(tomorrow() instanceof Date);
      assert.ok(yesterday() instanceof Date);
      assert.ok(dateAfterDays(new Date(), 5) instanceof Date);
    });

    test('diff calculations', () => {
      assert.equal(daysDiff('2026-09-10', '2026-09-15'), 5);
      assert.equal(weeksDiff('2026-09-01', '2026-09-15'), 2);
      assert.equal(monthsDiff('2026-01-01', '2026-03-01'), 2);
      assert.equal(yearsDiff('2024-01-01', '2026-01-01'), 2);
      assert.equal(daysBetween('2026-09-10', '2026-09-15').length, 5);
    });

    test('startOfDay and endOfDay boundaries', () => {
      const d = new Date(2026, 8, 19, 15, 30, 0);
      const start = startOfDay(d);
      assert.equal(start.getHours(), 0);
      assert.equal(start.getMinutes(), 0);
      assert.equal(start.getSeconds(), 0);

      const end = endOfDay(d);
      assert.equal(end.getHours(), 23);
      assert.equal(end.getMinutes(), 59);
      assert.equal(end.getSeconds(), 59);
    });

    test('easterDay computes date', () => {
      const easter = easterDay(2026);
      assert.ok(easter instanceof Date);
    });
  });

  describe('formatting', () => {
    test('formatDateTime, formatDate, formatTime, formatTimespan', () => {
      const d = new Date(2026, 8, 19, 14, 30, 45);
      assert.match(formatDateTime(d), /^2026-09-19 14:30:45$/);
      assert.equal(formatDate(d), '2026-09-19');
      assert.equal(formatTimespan(3661000), '0d 1h 01m 01s');
    });

    test('randomDate produces date in interval', () => {
      const min = new Date('2026-01-01');
      const max = new Date('2026-12-31');
      const r = randomDate(min, max);
      assert.ok(r.getTime() >= min.getTime() && r.getTime() <= max.getTime());
    });
  });

  describe('wire date serialization', () => {
    test('toWireDate and fromWireDate / parseDate', () => {
      const testDate = new Date('2026-09-06T10:15:30.123Z');
      assert.equal(toWireDate(testDate), '2026-09-06T10:15:30Z');
      assert.equal(toWireDate(null), null);
      assert.equal(toWireDate(undefined), undefined);

      const parsed = fromWireDate('2026-09-06T10:15:30Z');
      assert.ok(parsed instanceof Date);
      assert.equal(parsed.toISOString(), '2026-09-06T10:15:30.000Z');
      assert.equal(parseDate, fromWireDate);
    });
  });
});
