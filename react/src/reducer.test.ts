import { describe, expect, it } from 'vitest';
import { tasksReducer } from './reducer';
import type { Task } from './types';

const sample: Task[] = [
  { id: '1', text: 'Write tests', priority: 'high', done: false },
  { id: '2', text: 'Ship it', priority: 'low', done: true },
  { id: '3', text: 'Celebrate', priority: 'med', done: false, listId: 'work' },
];

describe('tasksReducer', () => {
  it('adds a trimmed task to the top', () => {
    const next = tasksReducer(sample, { type: 'add', id: '9', text: '  New  ', priority: 'med' });
    expect(next[0]).toMatchObject({ id: '9', text: 'New', done: false });
    expect(next).toHaveLength(4);
  });

  it('stores due date and list when given', () => {
    const next = tasksReducer(sample, { type: 'add', id: '9', text: 'Rent', priority: 'high', dueDate: '2026-11-05', listId: 'personal' });
    expect(next[0]).toMatchObject({ dueDate: '2026-11-05', listId: 'personal' });
  });

  it('rejects blank tasks', () => {
    expect(tasksReducer(sample, { type: 'add', id: '9', text: '   ', priority: 'low' })).toBe(sample);
  });

  it('toggles completion without mutating the original', () => {
    const next = tasksReducer(sample, { type: 'toggle', id: '1' });
    expect(next[0].done).toBe(true);
    expect(sample[0].done).toBe(false);
  });

  it('edits text and ignores empty edits', () => {
    expect(tasksReducer(sample, { type: 'edit', id: '1', text: 'Updated' })[0].text).toBe('Updated');
    expect(tasksReducer(sample, { type: 'edit', id: '1', text: ' ' })).toBe(sample);
  });

  it('updates fields but never blanks the title', () => {
    const next = tasksReducer(sample, { type: 'update', id: '1', patch: { notes: 'hello', text: '  ' } });
    expect(next[0]).toMatchObject({ notes: 'hello', text: 'Write tests' });
  });

  it('deletes and restores (undo) at the old position', () => {
    const removed = tasksReducer(sample, { type: 'delete', id: '1' });
    expect(removed.map((t) => t.id)).toEqual(['2', '3']);
    expect(tasksReducer(removed, { type: 'restore', task: sample[0], index: 0 }).map((t) => t.id)).toEqual(['1', '2', '3']);
  });

  it('does not restore the same task twice', () => {
    expect(tasksReducer(sample, { type: 'restore', task: sample[0], index: 0 })).toBe(sample);
  });

  it('adds, toggles and deletes subtasks', () => {
    let s = tasksReducer(sample, { type: 'addSub', taskId: '1', id: 's1', text: ' Step one ' });
    expect(s[0].subtasks).toEqual([{ id: 's1', text: 'Step one', done: false }]);
    s = tasksReducer(s, { type: 'toggleSub', taskId: '1', subId: 's1' });
    expect(s[0].subtasks?.[0].done).toBe(true);
    s = tasksReducer(s, { type: 'deleteSub', taskId: '1', subId: 's1' });
    expect(s[0].subtasks).toEqual([]);
  });

  it('ignores blank subtasks', () => {
    expect(tasksReducer(sample, { type: 'addSub', taskId: '1', id: 's1', text: ' ' })).toBe(sample);
  });

  it('moves a task to another position (drag and drop)', () => {
    expect(tasksReducer(sample, { type: 'move', from: '3', to: '1' }).map((t) => t.id)).toEqual(['3', '1', '2']);
    expect(tasksReducer(sample, { type: 'move', from: '1', to: '1' })).toBe(sample);
  });

  it('unassigns tasks when a list is deleted', () => {
    expect(tasksReducer(sample, { type: 'unassignList', listId: 'work' })[2].listId).toBeUndefined();
  });

  it('replaces everything on import', () => {
    expect(tasksReducer(sample, { type: 'replaceAll', tasks: [] })).toEqual([]);
  });

  it('clears only completed tasks', () => {
    expect(tasksReducer(sample, { type: 'clearDone' }).map((t) => t.id)).toEqual(['1', '3']);
  });

  const rec: Task[] = [
    { id: 'r', text: 'Gym', priority: 'med', done: false, dueDate: '2026-11-01', repeat: 'weekly', subtasks: [{ id: 's', text: 'Warm up', done: true }] },
  ];

  it('creates the next occurrence when a repeating task is completed', () => {
    const next = tasksReducer(rec, { type: 'toggle', id: 'r', nextId: 'r2' });
    expect(next.map((t) => t.id)).toEqual(['r2', 'r']);
    expect(next[0]).toMatchObject({ done: false, dueDate: '2026-11-08' });
    expect(next[0].subtasks?.[0].done).toBe(false);
    expect(next[1].done).toBe(true);
  });

  it('does not create a duplicate occurrence when toggled again', () => {
    let s = tasksReducer(rec, { type: 'toggle', id: 'r', nextId: 'r2' });
    s = tasksReducer(s, { type: 'toggle', id: 'r', nextId: 'r3' }); // un-complete
    s = tasksReducer(s, { type: 'toggle', id: 'r', nextId: 'r4' }); // complete again
    expect(s).toHaveLength(2);
  });

  it('does not repeat without a due date', () => {
    const plain: Task[] = [{ id: 'p', text: 'X', priority: 'low', done: false, repeat: 'daily' }];
    expect(tasksReducer(plain, { type: 'toggle', id: 'p', nextId: 'p2' })).toHaveLength(1);
  });

  it('removes the next occurrence again when the completion is undone', () => {
    let s = tasksReducer(rec, { type: 'toggle', id: 'r', nextId: 'r2' });
    s = tasksReducer(s, { type: 'toggle', id: 'r', nextId: 'r3' }); // un-complete
    expect(s.map((t) => t.id)).toEqual(['r']);
    expect(s[0]).toMatchObject({ done: false, dueDate: '2026-11-01' });
    // and completing it once more gives exactly one fresh occurrence
    s = tasksReducer(s, { type: 'toggle', id: 'r', nextId: 'r4' });
    expect(s.map((t) => t.id)).toEqual(['r4', 'r']);
  });

  it('keeps the next occurrence if it was already completed itself', () => {
    let s = tasksReducer(rec, { type: 'toggle', id: 'r', nextId: 'r2' });
    s = tasksReducer(s, { type: 'toggle', id: 'r2', nextId: 'r3' }); // finish the next one too
    s = tasksReducer(s, { type: 'toggle', id: 'r', nextId: 'r9' }); // undo the first
    expect(s.find((t) => t.id === 'r2')?.done).toBe(true);
    expect(s.find((t) => t.id === 'r')?.done).toBe(false);
  });

  it('does not copy bookkeeping fields or completion onto the next occurrence', () => {
    const next = tasksReducer(rec, { type: 'toggle', id: 'r', nextId: 'r2' });
    expect(next[0]).toEqual({
      id: 'r2', text: 'Gym', priority: 'med', done: false, dueDate: '2026-11-08', repeat: 'weekly',
      subtasks: [{ id: 's', text: 'Warm up', done: false }],
    });
    expect(rec[0].done).toBe(false); // the input state is never mutated
  });

  it('keeps a monthly task on its original day after a short month', () => {
    const monthly: Task[] = [{ id: 'm1', text: 'Pay rent', priority: 'high', done: false, dueDate: '2026-01-31', repeat: 'monthly' }];
    let s = tasksReducer(monthly, { type: 'toggle', id: 'm1', nextId: 'm2' });
    expect(s[0]).toMatchObject({ id: 'm2', dueDate: '2026-02-28' });
    s = tasksReducer(s, { type: 'toggle', id: 'm2', nextId: 'm3' });
    expect(s[0]).toMatchObject({ id: 'm3', dueDate: '2026-03-31' }); // not Mar 28
    s = tasksReducer(s, { type: 'toggle', id: 'm3', nextId: 'm4' });
    expect(s[0]).toMatchObject({ id: 'm4', dueDate: '2026-04-30' });
  });

  it('forgets the original day when the due date is changed by hand', () => {
    const monthly: Task[] = [{ id: 'm1', text: 'Pay rent', priority: 'high', done: false, dueDate: '2026-01-31', repeat: 'monthly' }];
    let s = tasksReducer(monthly, { type: 'toggle', id: 'm1', nextId: 'm2' }); // m2 due Feb 28, anchored on the 31st
    s = tasksReducer(s, { type: 'update', id: 'm2', patch: { dueDate: '2026-02-15' } });
    s = tasksReducer(s, { type: 'toggle', id: 'm2', nextId: 'm3' });
    expect(s[0]).toMatchObject({ id: 'm3', dueDate: '2026-03-15' });
  });

  it('skips missed occurrences when an overdue repeating task is completed', () => {
    const late: Task[] = [{ id: 'd', text: 'Vitamins', priority: 'low', done: false, dueDate: '2026-11-05', repeat: 'daily' }];
    const next = tasksReducer(late, { type: 'toggle', id: 'd', nextId: 'd2', today: '2026-11-10' });
    expect(next[0]).toMatchObject({ id: 'd2', dueDate: '2026-11-10', done: false });
  });

  it('drops the repeat when the due date is removed, and ignores a repeat without a date', () => {
    let s = tasksReducer(rec, { type: 'update', id: 'r', patch: { dueDate: undefined } });
    expect(s[0].repeat).toBeUndefined();
    s = tasksReducer(sample, { type: 'update', id: '1', patch: { repeat: 'daily' } });
    expect(s[0].repeat).toBeUndefined();
    s = tasksReducer(sample, { type: 'update', id: '1', patch: { repeat: 'daily', dueDate: '2026-11-10' } });
    expect(s[0]).toMatchObject({ repeat: 'daily', dueDate: '2026-11-10' });
  });

  it('restores several cleared tasks to their old positions (undo clear completed)', () => {
    const mixed: Task[] = [
      { id: 'a', text: 'A', priority: 'med', done: true },
      { id: 'b', text: 'B', priority: 'med', done: false },
      { id: 'c', text: 'C', priority: 'med', done: true },
      { id: 'd', text: 'D', priority: 'med', done: false },
    ];
    let s = tasksReducer(mixed, { type: 'clearDone' });
    expect(s.map((t) => t.id)).toEqual(['b', 'd']);
    for (const index of [0, 2]) s = tasksReducer(s, { type: 'restore', task: mixed[index], index });
    expect(s).toEqual(mixed);
  });

  it('reorders consistently whichever direction a task is moved', () => {
    const ids = (s: Task[]) => s.map((t) => t.id).join('');
    const four: Task[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id, priority: 'med', done: false }));
    expect(ids(tasksReducer(four, { type: 'move', from: 'a', to: 'c' }))).toBe('bcad'); // dragged down: lands after the target
    expect(ids(tasksReducer(four, { type: 'move', from: 'd', to: 'b' }))).toBe('adbc'); // dragged up: lands before the target
    expect(ids(tasksReducer(four, { type: 'move', from: 'b', to: 'c' }))).toBe('acbd'); // keyboard nudge down
    expect(ids(tasksReducer(four, { type: 'move', from: 'c', to: 'b' }))).toBe('acbd'); // keyboard nudge up
    expect(tasksReducer(four, { type: 'move', from: 'a', to: 'zzz' })).toBe(four); // unknown drop target
    expect(tasksReducer(four, { type: 'move', from: 'some dragged text', to: 'a' })).toBe(four); // foreign drag data
  });
});
