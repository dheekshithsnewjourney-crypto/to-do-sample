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
});
