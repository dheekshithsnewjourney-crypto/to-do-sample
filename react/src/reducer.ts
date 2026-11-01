import type { Priority, Task } from './types';

export type Action =
  | { type: 'add'; id: string; text: string; priority: Priority; dueDate?: string }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'restore'; task: Task; index: number }
  | { type: 'edit'; id: string; text: string }
  | { type: 'clearDone' };

// Pure function: easy to unit test, no side effects.
export function tasksReducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'add': {
      const text = action.text.trim();
      if (!text) return state;
      const task: Task = { id: action.id, text, priority: action.priority, done: false };
      if (action.dueDate) task.dueDate = action.dueDate;
      return [task, ...state];
    }
    case 'toggle':
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
    case 'delete':
      return state.filter((t) => t.id !== action.id);
    case 'restore': {
      if (state.some((t) => t.id === action.task.id)) return state;
      const next = [...state];
      next.splice(Math.min(action.index, next.length), 0, action.task);
      return next;
    }
    case 'edit': {
      const text = action.text.trim();
      if (!text) return state; // ignore empty edits
      return state.map((t) => (t.id === action.id ? { ...t, text } : t));
    }
    case 'clearDone':
      return state.filter((t) => !t.done);
  }
}
