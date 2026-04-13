/**
 * tests/countdown.test.js — Tests for countdown.js utilities.
 * Run with: node --test tests/countdown.test.js
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  getDaysBetween,
  getTimeUntil,
  formatDuration,
  isSameDay,
  createEvent,
  validateEvent,
} from '../src/countdown.js';

// ── getDaysBetween ─────────────────────────────────────────────────────────────

describe('getDaysBetween', () => {
  it('returns 0 for the same day', () => {
    const d = new Date(2026, 0, 1); // 2026-01-01
    assert.equal(getDaysBetween(d, d), 0);
  });

  it('returns 0 for same day at different times', () => {
    const from = new Date(2026, 3, 13, 0, 0, 0);
    const to   = new Date(2026, 3, 13, 23, 59, 59);
    assert.equal(getDaysBetween(from, to), 0);
  });

  it('returns 1 for consecutive days', () => {
    const from = new Date(2026, 0, 1);
    const to   = new Date(2026, 0, 2);
    assert.equal(getDaysBetween(from, to), 1);
  });

  it('returns -1 when to is before from', () => {
    const from = new Date(2026, 0, 2);
    const to   = new Date(2026, 0, 1);
    assert.equal(getDaysBetween(from, to), -1);
  });

  it('handles month boundaries correctly', () => {
    const from = new Date(2026, 0, 31); // Jan 31
    const to   = new Date(2026, 1, 1);  // Feb 1
    assert.equal(getDaysBetween(from, to), 1);
  });

  it('handles year boundaries correctly', () => {
    const from = new Date(2025, 11, 31); // Dec 31 2025
    const to   = new Date(2026, 0, 1);   // Jan 1 2026
    assert.equal(getDaysBetween(from, to), 1);
  });

  it('counts days across many months', () => {
    const from = new Date(2026, 0, 1);  // 2026-01-01
    const to   = new Date(2026, 11, 31); // 2026-12-31
    // 2026 is not a leap year → 365 - 1 = 364 days between Jan 1 and Dec 31
    assert.equal(getDaysBetween(from, to), 364);
  });

  it('counts days across years', () => {
    const from = new Date(2026, 0, 1);  // 2026-01-01
    const to   = new Date(2027, 0, 1);  // 2027-01-01
    assert.equal(getDaysBetween(from, to), 365); // 2026 not leap
  });

  it('handles leap year Feb 29', () => {
    const from = new Date(2028, 1, 28); // 2028-02-28 (leap year)
    const to   = new Date(2028, 2, 1);  // 2028-03-01
    assert.equal(getDaysBetween(from, to), 2); // crosses Feb 29
  });
});

// ── getTimeUntil ───────────────────────────────────────────────────────────────

describe('getTimeUntil', () => {
  it('returns isPast: false for a future date', () => {
    const now    = new Date(2026, 0, 1, 12, 0, 0);
    const target = new Date(2026, 0, 2, 12, 0, 0);
    const result = getTimeUntil(target, now);
    assert.equal(result.isPast, false);
    assert.equal(result.days, 1);
    assert.equal(result.hours, 0);
    assert.equal(result.minutes, 0);
    assert.equal(result.seconds, 0);
  });

  it('returns isPast: true for a past date', () => {
    const now    = new Date(2026, 0, 10, 0, 0, 0);
    const target = new Date(2026, 0, 1,  0, 0, 0);
    const result = getTimeUntil(target, now);
    assert.equal(result.isPast, true);
    assert.equal(result.days, 9);
  });

  it('counts hours correctly', () => {
    const now    = new Date(2026, 0, 1, 0, 0, 0);
    const target = new Date(2026, 0, 1, 3, 30, 0);
    const result = getTimeUntil(target, now);
    assert.equal(result.days, 0);
    assert.equal(result.hours, 3);
    assert.equal(result.minutes, 30);
    assert.equal(result.seconds, 0);
  });

  it('counts seconds correctly', () => {
    const now    = new Date(2026, 0, 1, 0, 0, 0);
    const target = new Date(2026, 0, 1, 0, 0, 45);
    const result = getTimeUntil(target, now);
    assert.equal(result.seconds, 45);
  });

  it('handles exactly now (0 diff)', () => {
    const now = new Date(2026, 0, 1, 12, 0, 0);
    const result = getTimeUntil(now, now);
    assert.equal(result.days, 0);
    assert.equal(result.hours, 0);
    assert.equal(result.minutes, 0);
    assert.equal(result.seconds, 0);
    // total diff is 0, not negative
    assert.ok(result.total === 0);
  });

  it('returns total as negative for past dates', () => {
    const now    = new Date(2026, 0, 10);
    const target = new Date(2026, 0, 1);
    const result = getTimeUntil(target, now);
    assert.ok(result.total < 0);
  });
});

// ── formatDuration ─────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats days + hours + minutes in Japanese', () => {
    const time = { days: 3, hours: 14, minutes: 25, seconds: 10 };
    const result = formatDuration(time, 'ja');
    assert.ok(result.includes('3日'), `got: ${result}`);
    assert.ok(result.includes('14時間'), `got: ${result}`);
    assert.ok(result.includes('25分'), `got: ${result}`);
  });

  it('formats days + hours in English', () => {
    const time = { days: 2, hours: 5, minutes: 0, seconds: 0 };
    const result = formatDuration(time, 'en');
    assert.ok(result.includes('2d'), `got: ${result}`);
    assert.ok(result.includes('5h'), `got: ${result}`);
  });

  it('shows seconds when days = 0 (Japanese)', () => {
    const time = { days: 0, hours: 0, minutes: 0, seconds: 30 };
    const result = formatDuration(time, 'ja');
    assert.ok(result.includes('30秒'), `got: ${result}`);
  });

  it('shows seconds when days = 0 (English)', () => {
    const time = { days: 0, hours: 1, minutes: 5, seconds: 20 };
    const result = formatDuration(time, 'en');
    assert.ok(result.includes('20s'), `got: ${result}`);
  });

  it('omits seconds when days > 0', () => {
    const time = { days: 1, hours: 2, minutes: 3, seconds: 45 };
    const result = formatDuration(time, 'ja');
    assert.ok(!result.includes('秒'), `should omit seconds, got: ${result}`);
  });

  it('returns "0秒" for zero duration (Japanese)', () => {
    const time = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    assert.equal(formatDuration(time, 'ja'), '0秒');
  });

  it('returns "0s" for zero duration (English)', () => {
    const time = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    assert.equal(formatDuration(time, 'en'), '0s');
  });

  it('defaults to Japanese when lang is omitted', () => {
    const time = { days: 1, hours: 0, minutes: 0, seconds: 0 };
    const result = formatDuration(time);
    assert.ok(result.includes('日'), `got: ${result}`);
  });
});

// ── isSameDay ──────────────────────────────────────────────────────────────────

describe('isSameDay', () => {
  it('returns true for the same date object', () => {
    const d = new Date(2026, 3, 13);
    assert.equal(isSameDay(d, d), true);
  });

  it('returns true for same date different times', () => {
    const a = new Date(2026, 3, 13, 0, 0, 0);
    const b = new Date(2026, 3, 13, 23, 59, 59);
    assert.equal(isSameDay(a, b), true);
  });

  it('returns false for consecutive days', () => {
    const a = new Date(2026, 3, 13);
    const b = new Date(2026, 3, 14);
    assert.equal(isSameDay(a, b), false);
  });

  it('returns false across month boundary', () => {
    const a = new Date(2026, 0, 31); // Jan 31
    const b = new Date(2026, 1, 1);  // Feb 1
    assert.equal(isSameDay(a, b), false);
  });

  it('returns false across year boundary (Dec 31 vs Jan 1)', () => {
    const a = new Date(2025, 11, 31);
    const b = new Date(2026, 0, 1);
    assert.equal(isSameDay(a, b), false);
  });

  it('handles midnight boundary (just before midnight = same day)', () => {
    const a = new Date(2026, 3, 13, 23, 59, 59, 999);
    const b = new Date(2026, 3, 13, 0, 0, 0, 0);
    assert.equal(isSameDay(a, b), true);
  });
});

// ── createEvent ────────────────────────────────────────────────────────────────

describe('createEvent', () => {
  it('creates an event with required fields', () => {
    const ev = createEvent('Test', '2026-12-25');
    assert.equal(ev.name, 'Test');
    assert.equal(ev.date, '2026-12-25');
    assert.ok(ev.id, 'should have id');
    assert.ok(ev.createdAt, 'should have createdAt');
  });

  it('applies default color and icon', () => {
    const ev = createEvent('Test', '2026-12-25');
    assert.equal(ev.color, '#4f8ef7');
    assert.equal(ev.icon, '🗓️');
  });

  it('accepts custom color and icon', () => {
    const ev = createEvent('Birthday', '2026-06-01', '#e91e63', '🎂');
    assert.equal(ev.color, '#e91e63');
    assert.equal(ev.icon, '🎂');
  });

  it('generates unique ids', () => {
    const a = createEvent('A', '2026-01-01');
    const b = createEvent('B', '2026-01-01');
    assert.notEqual(a.id, b.id);
  });
});

// ── validateEvent ──────────────────────────────────────────────────────────────

describe('validateEvent', () => {
  it('passes for a valid event', () => {
    const result = validateEvent({ name: 'Birthday', date: '2026-06-01' });
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('fails when name is missing', () => {
    const result = validateEvent({ name: '', date: '2026-06-01' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Name')));
  });

  it('fails when name is only whitespace', () => {
    const result = validateEvent({ name: '   ', date: '2026-06-01' });
    assert.equal(result.valid, false);
  });

  it('fails when name exceeds 100 characters', () => {
    const result = validateEvent({ name: 'a'.repeat(101), date: '2026-06-01' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('100')));
  });

  it('passes for name exactly 100 characters', () => {
    const result = validateEvent({ name: 'a'.repeat(100), date: '2026-06-01' });
    assert.equal(result.valid, true);
  });

  it('fails when date is missing', () => {
    const result = validateEvent({ name: 'Test', date: '' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Date')));
  });

  it('fails for an invalid date string', () => {
    const result = validateEvent({ name: 'Test', date: 'not-a-date' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('invalid')));
  });

  it('fails when event is not an object', () => {
    const result = validateEvent(null);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('accumulates multiple errors', () => {
    const result = validateEvent({ name: '', date: '' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 2);
  });
});
