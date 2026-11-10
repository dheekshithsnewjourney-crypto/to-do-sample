import { describe, expect, it } from 'vitest';
import { dueInfo, greeting, isISODate, nextDue, nextDueFrom, parseISO, todayISO } from './dates';

describe('nextDue', () => {
  it('moves by a day or a week', () => {
    expect(nextDue('2026-11-30', 'daily')).toBe('2026-12-01');
    expect(nextDue('2026-11-01', 'weekly')).toBe('2026-11-08');
  });
  it('moves by a month and clamps to the last day', () => {
    expect(nextDue('2026-10-15', 'monthly')).toBe('2026-11-15');
    expect(nextDue('2026-01-31', 'monthly')).toBe('2026-02-28');
  });
  it('clamps to Feb 29 in a leap year and rolls over the year end', () => {
    expect(nextDue('2028-01-31', 'monthly')).toBe('2028-02-29');
    expect(nextDue('2026-12-31', 'monthly')).toBe('2027-01-31');
    expect(nextDue('2026-12-31', 'daily')).toBe('2027-01-01');
    expect(nextDue('2026-12-28', 'weekly')).toBe('2027-01-04');
  });
  it('returns to the original day of the month after a short month', () => {
    // Jan 31 -> Feb 28 -> Mar 31 (not Mar 28), when the anchor day is passed along
    expect(nextDue('2026-02-28', 'monthly', 31)).toBe('2026-03-31');
    expect(nextDue('2026-03-31', 'monthly', 31)).toBe('2026-04-30');
    expect(nextDue('2026-04-30', 'monthly', 31)).toBe('2026-05-31');
    expect(nextDue('2026-02-28', 'monthly', 30)).toBe('2026-03-30');
  });
  it('is not thrown off by daylight-saving changes', () => {
    // these dates straddle the DST switches in the US and in Europe
    expect(nextDue('2026-03-07', 'daily')).toBe('2026-03-08');
    expect(nextDue('2026-03-08', 'daily')).toBe('2026-03-09');
    expect(nextDue('2026-03-28', 'daily')).toBe('2026-03-29');
    expect(nextDue('2026-10-24', 'weekly')).toBe('2026-10-31');
    expect(nextDue('2026-10-31', 'daily')).toBe('2026-11-01');
  });
});

describe('nextDueFrom', () => {
  it('skips occurrences that are already in the past', () => {
    // a daily task that is 5 days late: the next one is today, not 4 days ago
    expect(nextDueFrom('2026-11-05', 'daily', '2026-11-10')).toBe('2026-11-10');
    expect(nextDueFrom('2026-10-05', 'weekly', '2026-11-10')).toBe('2026-11-16');
    expect(nextDueFrom('2026-01-31', 'monthly', '2026-04-15')).toBe('2026-04-30');
  });
  it('moves one step when the task is done on time or early', () => {
    expect(nextDueFrom('2026-11-10', 'daily', '2026-11-10')).toBe('2026-11-11');
    expect(nextDueFrom('2026-11-20', 'weekly', '2026-11-10')).toBe('2026-11-27');
  });
});

describe('parseISO / isISODate', () => {
  it('accepts real calendar dates only', () => {
    expect(isISODate('2026-11-05')).toBe(true);
    expect(isISODate('2028-02-29')).toBe(true);
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('2026-2-3')).toBe(false);
    expect(isISODate('banana')).toBe(false);
    expect(isISODate('')).toBe(false);
    expect(isISODate(20261105)).toBe(false);
    expect(isISODate(null)).toBe(false);
  });
  it('builds a local-midnight date, including years below 100', () => {
    const d = parseISO('2026-11-05')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 5, 0]);
    // a date input emits values like 0002-01-01 while the year is being typed
    expect(parseISO('0002-01-01')!.getFullYear()).toBe(2);
    expect(todayISO(parseISO('0002-01-01')!)).toBe('0002-01-01');
  });
});

describe('todayISO', () => {
  it('uses the local calendar day on both sides of midnight', () => {
    expect(todayISO(new Date(2026, 10, 10, 23, 59, 59))).toBe('2026-11-10');
    expect(todayISO(new Date(2026, 10, 11, 0, 0, 0))).toBe('2026-11-11');
    expect(todayISO(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
    expect(todayISO(new Date(2027, 0, 1, 0, 0, 1))).toBe('2027-01-01');
  });
});

describe('dueInfo', () => {
  const noon = new Date(2026, 10, 10, 12, 0);

  it('labels today, tomorrow and later dates', () => {
    expect(dueInfo('2026-11-10', false, noon)).toEqual({ label: 'Today', tone: 'today' });
    expect(dueInfo('2026-11-11', false, noon)).toEqual({ label: 'Tomorrow', tone: 'later' });
    expect(dueInfo('2026-11-20', false, noon).tone).toBe('later');
  });
  it('labels overdue tasks in words, not just by tone', () => {
    expect(dueInfo('2026-11-09', false, noon)).toEqual({ label: 'Due yesterday', tone: 'overdue' });
    expect(dueInfo('2026-11-07', false, noon)).toEqual({ label: '3 days overdue', tone: 'overdue' });
  });
  it('does not call a completed task overdue', () => {
    const late = dueInfo('2026-11-07', true, noon);
    expect(late.tone).toBe('later');
    expect(late.label).not.toMatch(/overdue|yesterday/i);
    expect(dueInfo('2026-11-10', true, noon).tone).toBe('later');
  });
  it('flips exactly at local midnight', () => {
    expect(dueInfo('2026-11-10', false, new Date(2026, 10, 10, 23, 59, 59)).tone).toBe('today');
    expect(dueInfo('2026-11-10', false, new Date(2026, 10, 11, 0, 0, 1))).toEqual({ label: 'Due yesterday', tone: 'overdue' });
    expect(dueInfo('2026-11-10', false, new Date(2026, 10, 9, 23, 59, 59)).label).toBe('Tomorrow');
  });
  it('counts whole days across daylight-saving changes and month ends', () => {
    expect(dueInfo('2026-03-07', false, new Date(2026, 2, 9, 9, 0)).label).toBe('2 days overdue');
    expect(dueInfo('2026-10-24', false, new Date(2026, 10, 2, 9, 0)).label).toBe('9 days overdue');
    expect(dueInfo('2026-02-28', false, new Date(2026, 2, 1, 0, 30)).label).toBe('Due yesterday');
  });
  it('survives a malformed date instead of throwing', () => {
    expect(() => dueInfo('banana', false, noon)).not.toThrow();
    expect(dueInfo('banana', false, noon).tone).toBe('later');
    expect(dueInfo('banana', false, noon).label).not.toMatch(/invalid|nan/i);
  });
});

describe('greeting', () => {
  it('follows the clock it is given', () => {
    expect(greeting(new Date(2026, 10, 10, 0, 0))).toBe('Good morning');
    expect(greeting(new Date(2026, 10, 10, 11, 59))).toBe('Good morning');
    expect(greeting(new Date(2026, 10, 10, 12, 0))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 10, 10, 18, 0))).toBe('Good evening');
  });
});
