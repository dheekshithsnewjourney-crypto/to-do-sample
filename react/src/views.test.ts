import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Task } from './types';
import { uid } from './uid';
import { count, dueForNewTask, inView, monogram, whenLabel } from './views';

const today = '2026-11-10';
const task = (over: Partial<Task>): Task => ({ id: 'x', text: 'X', priority: 'med', done: false, ...over });

describe('inView', () => {
  it('puts due-today and unfinished overdue tasks in Today', () => {
    expect(inView(task({ dueDate: today }), 'today', today)).toBe(true);
    expect(inView(task({ dueDate: '2026-11-09' }), 'today', today)).toBe(true);
    expect(inView(task({ dueDate: '2026-11-09', done: true }), 'today', today)).toBe(false);
    expect(inView(task({ dueDate: '2026-11-11' }), 'today', today)).toBe(false);
    expect(inView(task({}), 'today', today)).toBe(false);
  });
  it('splits Upcoming and Overdue exactly at today', () => {
    expect(inView(task({ dueDate: '2026-11-11' }), 'upcoming', today)).toBe(true);
    expect(inView(task({ dueDate: today }), 'upcoming', today)).toBe(false);
    expect(inView(task({ dueDate: '2026-11-09' }), 'overdue', today)).toBe(true);
    expect(inView(task({ dueDate: today }), 'overdue', today)).toBe(false);
    expect(inView(task({ dueDate: '2026-11-09', done: true }), 'overdue', today)).toBe(false);
  });
  it('compares across month and year ends', () => {
    expect(inView(task({ dueDate: '2026-12-31' }), 'overdue', '2027-01-01')).toBe(true);
    expect(inView(task({ dueDate: '2027-01-01' }), 'upcoming', '2026-12-31')).toBe(true);
    expect(inView(task({ dueDate: '2026-10-31' }), 'overdue', '2026-11-01')).toBe(true);
  });
  it('matches lists by id and shows everything in All', () => {
    expect(inView(task({ listId: 'work' }), 'list:work', today)).toBe(true);
    expect(inView(task({ listId: 'home' }), 'list:work', today)).toBe(false);
    expect(inView(task({}), 'list:work', today)).toBe(false);
    expect(inView(task({}), 'all', today)).toBe(true);
  });
});

describe('dueForNewTask', () => {
  it('gives a task added in Today a due date of today, so it shows up where it was added', () => {
    expect(dueForNewTask('today', today)).toBe(today);
    expect(dueForNewTask('today', today, '2026-11-20')).toBe('2026-11-20'); // an explicit date always wins
  });
  it('leaves the date alone everywhere else', () => {
    expect(dueForNewTask('all', today)).toBeUndefined();
    expect(dueForNewTask('upcoming', today)).toBeUndefined();
    expect(dueForNewTask('list:work', today, '2026-11-12')).toBe('2026-11-12');
  });
});

describe('monogram', () => {
  it('uses two letters, so lists that share an initial still differ', () => {
    expect(monogram('Work')).toBe('WO');
    expect(monogram('Personal')).toBe('PE');
    expect(monogram('Projects')).toBe('PR');
    expect(monogram('side projects')).toBe('SP');
  });
  it('copes with short, padded and non-Latin names', () => {
    expect(monogram('  x ')).toBe('X');
    expect(monogram('')).toBe('');
    expect(monogram('家事')).toBe('家事');
    expect(monogram('🏠 Home')).toBe('🏠H');
  });
});

describe('uid', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('makes unique ids', () => {
    expect(new Set(Array.from({ length: 200 }, uid)).size).toBe(200);
  });
  it('still works where crypto.randomUUID is unavailable (plain http, old browsers)', () => {
    vi.stubGlobal('crypto', {});
    const a = uid();
    expect(a).toMatch(/\S{8,}/);
    expect(uid()).not.toBe(a);
  });
});

describe('count', () => {
  it('uses the singular only for exactly one', () => {
    expect(count(0, 'task')).toBe('0 tasks');
    expect(count(1, 'task')).toBe('1 task');
    expect(count(2, 'completed task')).toBe('2 completed tasks');
  });
});

describe('whenLabel', () => {
  const t = (p: Partial<Task>): Task => ({ id: 'x', text: 'x', priority: 'med', done: false, ...p });
  it('puts each task in the group the sheet shows it under', () => {
    expect(whenLabel(t({ done: true, dueDate: '2026-11-01' }), '2026-11-11')).toBe('Done');
    expect(whenLabel(t({}), '2026-11-11')).toBe('No date');
    expect(whenLabel(t({ dueDate: '2026-11-10' }), '2026-11-11')).toBe('Overdue');
    expect(whenLabel(t({ dueDate: '2026-11-11' }), '2026-11-11')).toBe('Today');
    expect(whenLabel(t({ dueDate: '2026-12-01' }), '2026-11-30')).toBe('Tomorrow'); // across a month end
    const later = new Date(2026, 10, 14).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    expect(whenLabel(t({ dueDate: '2026-11-14' }), '2026-11-11')).toBe(later);
  });
});
