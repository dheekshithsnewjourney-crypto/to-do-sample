import { nextDueFrom, parseISO } from './dates';
import type { Priority, Task } from './types';

export type Action =
  | { type: 'add'; id: string; text: string; priority: Priority; dueDate?: string; listId?: string }
  | { type: 'toggle'; id: string; nextId?: string; today?: string }
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

// Completing a repeating task: mark it done and put the next occurrence right where it was.
function completeRepeating(state: Task[], target: Task, nextId: string, today?: string): Task[] {
  const anchor = target.repeatDay ?? parseISO(target.dueDate)?.getDate();
  const dueDate = nextDueFrom(target.dueDate!, target.repeat!, today, anchor);
  const exists = state.some((t) => t.id !== target.id && !t.done && t.text === target.text && t.dueDate === dueDate);
  if (exists) return mapTask(state, target.id, (t) => ({ ...t, done: true }));

  const next: Task = { ...target, id: nextId, done: false, dueDate };
  delete next.spawnedId;
  if (target.subtasks) next.subtasks = target.subtasks.map((s) => ({ ...s, done: false }));
  if (target.repeat === 'monthly') next.repeatDay = anchor;
  // The finished task remembers what it created, so un-completing it can take that back.
  return state.flatMap((t) => (t.id === target.id ? [next, { ...t, done: true, spawnedId: nextId }] : [t]));
}

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
      if (!target.done && target.repeat && target.dueDate && action.nextId) {
        return completeRepeating(state, target, action.nextId, action.today);
      }
      if (target.done && target.spawnedId) {
        // Undoing a completion also removes the occurrence it spawned, unless that one is done already.
        const { spawnedId, ...rest } = target;
        return state
          .filter((t) => t.id !== spawnedId || t.done)
          .map((t) => (t.id === target.id ? { ...rest, done: false } : t));
      }
      return mapTask(state, action.id, (t) => ({ ...t, done: !t.done }));
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
      if (patch.text !== undefined) {
        patch.text = patch.text.trim();
        if (!patch.text) delete patch.text;
      }
      return mapTask(state, action.id, (t) => {
        const next = { ...t, ...patch };
        if ('dueDate' in patch) delete next.repeatDay; // a hand-picked date starts a new monthly anchor
        if (!next.dueDate) delete next.repeat; // a repeat needs a date to count from
        return next;
      });
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
      // Used by both drag and drop and Alt+Arrow: the task takes the target's slot.
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
