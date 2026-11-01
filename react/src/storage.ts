import type { Task } from './types';

const KEY = 'todo-app:v1';

export function loadTasks(): Task[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return []; // corrupted or blocked storage
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    /* storage full or blocked: app keeps working in memory */
  }
}
