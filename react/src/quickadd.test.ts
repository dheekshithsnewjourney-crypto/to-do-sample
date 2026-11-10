import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from './quickadd';

const now = new Date(2026, 10, 1); // 1 Nov 2026

describe('parseQuickAdd', () => {
  it('reads priority and tomorrow', () => {
    expect(parseQuickAdd('Pay rent tomorrow !high', now)).toEqual({ text: 'Pay rent', priority: 'high', dueDate: '2026-11-02' });
  });
  it('reads today', () => {
    expect(parseQuickAdd('Call mom today', now)).toMatchObject({ text: 'Call mom', dueDate: '2026-11-01' });
  });
  it('leaves plain text alone', () => {
    expect(parseQuickAdd('Buy milk', now)).toEqual({ text: 'Buy milk', priority: undefined, dueDate: undefined });
  });
  it('keeps a lone date word as the title', () => {
    expect(parseQuickAdd('today', now)).toMatchObject({ text: 'today', dueDate: undefined });
  });

  it('does not treat a date word inside a phrase as a due date', () => {
    expect(parseQuickAdd("Plan tomorrow's meeting", now)).toEqual({ text: "Plan tomorrow's meeting", priority: undefined, dueDate: undefined });
    expect(parseQuickAdd('Watch "Tomorrow," the film', now)).toMatchObject({ text: 'Watch "Tomorrow," the film', dueDate: undefined });
    expect(parseQuickAdd('Fix today-view bug', now)).toMatchObject({ text: 'Fix today-view bug', dueDate: undefined });
  });
  it('uses the last standalone date word and keeps earlier ones in the title', () => {
    expect(parseQuickAdd("Read today's paper tomorrow", now)).toEqual({ text: "Read today's paper", priority: undefined, dueDate: '2026-11-02' });
  });
  it('is case-insensitive and works at the start of the input', () => {
    expect(parseQuickAdd('TOMORROW call the bank !HIGH', now)).toEqual({ text: 'call the bank', priority: 'high', dueDate: '2026-11-02' });
  });
  it('understands !medium as well as !med', () => {
    expect(parseQuickAdd('Water plants !medium', now)).toEqual({ text: 'Water plants', priority: 'med', dueDate: undefined });
    expect(parseQuickAdd('Water plants !med', now).priority).toBe('med');
  });
  it('removes every priority token and lets the last one win', () => {
    expect(parseQuickAdd('Ship it !low !high', now)).toEqual({ text: 'Ship it', priority: 'high', dueDate: undefined });
  });
  it('ignores things that only look like a priority', () => {
    expect(parseQuickAdd('Wow!high five', now)).toMatchObject({ text: 'Wow!high five', priority: undefined });
    expect(parseQuickAdd('Aim !higher', now)).toMatchObject({ text: 'Aim !higher', priority: undefined });
  });
  it('returns an empty title when only tokens were typed', () => {
    expect(parseQuickAdd('  !high  ', now).text).toBe('');
    expect(parseQuickAdd('   ', now).text).toBe('');
  });
  it('keeps a lone date word as the title even with a priority', () => {
    expect(parseQuickAdd('tomorrow !low', now)).toEqual({ text: 'tomorrow', priority: 'low', dueDate: undefined });
  });
  it('rolls "tomorrow" over month and year ends', () => {
    expect(parseQuickAdd('Rent tomorrow', new Date(2026, 0, 31, 23, 59)).dueDate).toBe('2026-02-01');
    expect(parseQuickAdd('Party tomorrow', new Date(2026, 11, 31, 12)).dueDate).toBe('2027-01-01');
    expect(parseQuickAdd('Leap tomorrow', new Date(2028, 1, 28)).dueDate).toBe('2028-02-29');
  });
  it('collapses the whitespace left behind', () => {
    expect(parseQuickAdd('  Buy   milk   today   !low ', now).text).toBe('Buy milk');
  });
});
