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
});
