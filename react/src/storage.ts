import { parseHex } from './color';
import { isISODate } from './dates';
import type { List, Subtask, Task } from './types';

const TASKS_KEY = 'todo-app:v1';
const LISTS_KEY = 'todo-lists:v1';
const DEFAULT_COLOR = '#D62839';

export const DEFAULT_LISTS: List[] = [
  { id: 'personal', name: 'Personal', color: DEFAULT_COLOR },
  { id: 'work', name: 'Work', color: '#FFC53D' },
];

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? (v as T) : undefined;

// Drops entries with a missing or repeated id (duplicates would break React keys and toggling).
function uniqueById<T extends { id: string }>(items: (T | null)[]): T[] {
  const seen = new Set<string>();
  return items.filter((item): item is T => !!item && !seen.has(item.id) && !!seen.add(item.id));
}

function sanitizeSubtask(raw: unknown): Subtask | null {
  if (!isObject(raw) || !text(raw.id) || !text(raw.text)) return null;
  return { id: raw.id as string, text: text(raw.text), done: raw.done === true };
}

// Rebuilds a task from known fields only. Stored and imported data is never trusted as-is:
// a wrong type in any field used to be enough to crash rendering.
export function sanitizeTask(raw: unknown, listIds?: Set<string>): Task | null {
  if (!isObject(raw) || !text(raw.id) || !text(raw.text)) return null;
  const task: Task = {
    id: raw.id as string,
    text: text(raw.text),
    priority: oneOf(raw.priority, ['low', 'med', 'high'] as const) ?? 'med',
    done: raw.done === true,
  };
  if (isISODate(raw.dueDate)) task.dueDate = raw.dueDate;
  if (typeof raw.notes === 'string' && raw.notes) task.notes = raw.notes;
  if (typeof raw.listId === 'string' && (!listIds || listIds.has(raw.listId))) task.listId = raw.listId;
  if (Array.isArray(raw.subtasks)) {
    const subtasks = uniqueById(raw.subtasks.map(sanitizeSubtask));
    if (subtasks.length) task.subtasks = subtasks;
  }
  const repeat = oneOf(raw.repeat, ['daily', 'weekly', 'monthly'] as const);
  if (repeat && task.dueDate) {
    task.repeat = repeat;
    const day = raw.repeatDay;
    if (repeat === 'monthly' && typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 31) task.repeatDay = day;
  }
  if (task.done && typeof raw.spawnedId === 'string') task.spawnedId = raw.spawnedId;
  return task;
}

export function sanitizeTasks(raw: unknown, listIds?: Set<string>): Task[] {
  return Array.isArray(raw) ? uniqueById(raw.map((t) => sanitizeTask(t, listIds))) : [];
}

export function sanitizeLists(raw: unknown): List[] {
  if (!Array.isArray(raw)) return [];
  return uniqueById(raw.map((l) => (
    isObject(l) && text(l.id) && text(l.name)
      ? { id: l.id as string, name: text(l.name), color: parseHex(l.color) ? (l.color as string) : DEFAULT_COLOR }
      : null
  )));
}

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null; // corrupted or blocked storage
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: app keeps working in memory */
  }
}

// Passing the lists also unassigns tasks that point at a list which no longer exists.
export const loadTasks = (lists?: List[]): Task[] =>
  sanitizeTasks(read(TASKS_KEY), lists && new Set(lists.map((l) => l.id)));
export const saveTasks = (tasks: Task[]): void => write(TASKS_KEY, tasks);
export function loadLists(): List[] {
  const raw = read(LISTS_KEY);
  return Array.isArray(raw) ? sanitizeLists(raw) : DEFAULT_LISTS; // an empty array is a valid choice
}
export const saveLists = (lists: List[]): void => write(LISTS_KEY, lists);

// Validates and cleans an imported backup file. Returns null if it is not usable.
// A task without a usable id or title rejects the whole file: silently dropping tasks from a
// backup that is about to replace everything would be worse than refusing it.
export function parseBackup(json: string): { tasks: Task[]; lists: List[] } | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isObject(data) || !Array.isArray(data.tasks)) return null;
  const lists = 'lists' in data ? sanitizeLists(data.lists) : DEFAULT_LISTS;
  const listIds = new Set(lists.map((l) => l.id));
  const tasks = data.tasks.map((t) => sanitizeTask(t, listIds));
  if (tasks.some((t) => !t)) return null;
  return { tasks: uniqueById(tasks), lists };
}
