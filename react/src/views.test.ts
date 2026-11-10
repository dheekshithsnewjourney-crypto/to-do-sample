import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Task } from './types';
import { uid } from './uid';
import { dueForNewTask, inView, monogram } from './views';

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
