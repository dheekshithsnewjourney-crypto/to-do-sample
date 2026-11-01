import { describe, expect, it } from 'vitest';
import { tasksReducer } from './reducer';
import type { Task } from './types';

const sample: Task[] = [
  { id: '1', text: 'Write tests', priority: 'high', done: false },
  { id: '2', text: 'Ship it', priority: 'low', done: true },
];

describe('tasksReducer', () => {
  it('adds a trimmed task to the top', () => {
    const next = tasksReducer(sample, { type: 'add', id: '3', text: '  New  ', priority: 'med' });
    expect(next[0]).toMatchObject({ id: '3', text: 'New', done: false });
    expect(next).toHaveLength(3);
  });

  it('stores a due date when given', () => {
    const next = tasksReducer(sample, { type: 'add', id: '3', text: 'Pay rent', priority: 'high', dueDate: '2026-11-05' });
    expect(next[0].dueDate).toBe('2026-11-05');
  });

  it('rejects blank tasks', () => {
    expect(tasksReducer(sample, { type: 'add', id: '3', text: '   ', priority: 'low' })).toBe(sample);
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

  it('deletes a task', () => {
    expect(tasksReducer(sample, { type: 'delete', id: '1' }).map((t) => t.id)).toEqual(['2']);
  });

  it('restores a deleted task at its old position (undo)', () => {
    const removed = tasksReducer(sample, { type: 'delete', id: '1' });
    const back = tasksReducer(removed, { type: 'restore', task: sample[0], index: 0 });
    expect(back.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('does not restore the same task twice', () => {
    expect(tasksReducer(sample, { type: 'restore', task: sample[0], index: 0 })).toBe(sample);
  });

  it('clears only completed tasks', () => {
    expect(tasksReducer(sample, { type: 'clearDone' }).map((t) => t.id)).toEqual(['1']);
  });
});
