import { nextDue } from './dates';
import type { Priority, Task } from './types';

export type Action =
  | { type: 'add'; id: string; text: string; priority: Priority; dueDate?: string; listId?: string }
  | { type: 'toggle'; id: string; nextId?: string }
  | { type: 'delete'; id: string }
  | { type: 'restore'; task: Task; index: number }
  | { type: 'edit'; id: string; text: string }
  | { type: 'update'; id: string; patch: Partial<Omit<Task, 'id'>> }
  | { type: 'addSub'; taskId: string; id: string; text: string }
  | { type: 'toggleSub'; taskId: string; subId: string }
  | { type: 'deleteSub'; taskId: string; subId: string }
  | { type: 'move'; from: string; to: string }
  | { type: 'unassignList'; listId: string }
  | { type: 'replaceAll'; tasks: Task[] }
  | { type: 'clearDone' };

const mapTask = (state: Task[], id: string, fn: (t: Task) => Task) =>
  state.map((t) => (t.id === id ? fn(t) : t));

// Pure function: easy to unit test, no side effects.
export function tasksReducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'add': {
      const text = action.text.trim();
      if (!text) return state;
      const task: Task = { id: action.id, text, priority: action.priority, done: false };
      if (action.dueDate) task.dueDate = action.dueDate;
      if (action.listId) task.listId = action.listId;
      return [task, ...state];
    }
    case 'toggle': {
      const target = state.find((t) => t.id === action.id);
      if (!target) return state;
      const next = state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
      // Completing a repeating task creates the next occurrence right where it was
      if (!target.done && target.repeat && target.dueDate && action.nextId) {
        const dueDate = nextDue(target.dueDate, target.repeat);
        const exists = state.some((t) => t.id !== target.id && !t.done && t.text === target.text && t.dueDate === dueDate);
        if (!exists) {
          const clone: Task = {
            ...target,
            id: action.nextId,
            done: false,
            dueDate,
            subtasks: target.subtasks?.map((s) => ({ ...s, done: false })),
          };
          next.splice(state.findIndex((t) => t.id === action.id), 0, clone);
        }
      }
      return next;
    }
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
      return mapTask(state, action.id, (t) => ({ ...t, text }));
    }
    case 'update': {
      const patch = { ...action.patch };
      if (patch.text !== undefined && !patch.text.trim()) delete patch.text;
      return mapTask(state, action.id, (t) => ({ ...t, ...patch }));
    }
    case 'addSub': {
      const text = action.text.trim();
      if (!text) return state;
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: [...(t.subtasks ?? []), { id: action.id, text, done: false }],
      }));
    }
    case 'toggleSub':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: (t.subtasks ?? []).map((s) => (s.id === action.subId ? { ...s, done: !s.done } : s)),
      }));
    case 'deleteSub':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: (t.subtasks ?? []).filter((s) => s.id !== action.subId),
      }));
    case 'move': {
      const from = state.findIndex((t) => t.id === action.from);
      const to = state.findIndex((t) => t.id === action.to);
      if (from < 0 || to < 0 || from === to) return state;
      const next = [...state];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    }
    case 'unassignList':
      return state.map((t) => (t.listId === action.listId ? { ...t, listId: undefined } : t));
    case 'replaceAll':
      return action.tasks;
    case 'clearDone':
      return state.filter((t) => !t.done);
  }
}
