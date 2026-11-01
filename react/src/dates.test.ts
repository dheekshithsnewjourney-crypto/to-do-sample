import { describe, expect, it } from 'vitest';
import { nextDue } from './dates';

describe('nextDue', () => {
  it('moves by a day or a week', () => {
    expect(nextDue('2026-11-30', 'daily')).toBe('2026-12-01');
    expect(nextDue('2026-11-01', 'weekly')).toBe('2026-11-08');
  });
  it('moves by a month and clamps to the last day', () => {
    expect(nextDue('2026-10-15', 'monthly')).toBe('2026-11-15');
    expect(nextDue('2026-01-31', 'monthly')).toBe('2026-02-28');
  });
});
