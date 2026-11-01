import type { List, Priority, Task } from './types';

const TASKS_KEY = 'todo-app:v1';
const LISTS_KEY = 'todo-lists:v1';

export const DEFAULT_LISTS: List[] = [
  { id: 'personal', name: 'Personal', color: '#5b5bd6' },
  { id: 'work', name: 'Work', color: '#e5a000' },
];

function read<T>(key: string, fallback: T): T {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? 'null');
    return Array.isArray(data) ? (data as T) : fallback;
  } catch {
    return fallback; // corrupted or blocked storage
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: app keeps working in memory */
  }
}

export const loadTasks = (): Task[] => read<Task[]>(TASKS_KEY, []);
export const saveTasks = (tasks: Task[]): void => write(TASKS_KEY, tasks);
export const loadLists = (): List[] => read<List[]>(LISTS_KEY, DEFAULT_LISTS);
export const saveLists = (lists: List[]): void => write(LISTS_KEY, lists);

// Validates and cleans an imported backup file. Returns null if it is not usable.
export function parseBackup(text: string): { tasks: Task[]; lists: List[] } | null {
  try {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.tasks)) return null;
    if (!data.tasks.every((t: any) => t && typeof t.id === 'string' && typeof t.text === 'string')) return null;

    const tasks: Task[] = data.tasks.map((t: any) => ({
      ...t,
      priority: (['low', 'med', 'high'].includes(t.priority) ? t.priority : 'med') as Priority,
      done: Boolean(t.done),
    }));
    const lists: List[] = (Array.isArray(data.lists) ? data.lists : [])
      .filter((l: any) => l && typeof l.id === 'string' && typeof l.name === 'string')
      .map((l: any) => ({ id: l.id, name: l.name, color: typeof l.color === 'string' ? l.color : '#5b5bd6' }));
    return { tasks, lists };
  } catch {
    return null;
  }
}
