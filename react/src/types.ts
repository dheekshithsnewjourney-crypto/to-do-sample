export type Priority = 'low' | 'med' | 'high';
export type Filter = 'all' | 'active' | 'done';
export type Sort = 'manual' | 'due' | 'priority';
export type Repeat = 'daily' | 'weekly' | 'monthly';
export type View = 'all' | 'today' | 'upcoming' | 'overdue' | `list:${string}`;

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

// Optional fields keep older saved data loading fine.
export interface Task {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  listId?: string;
  subtasks?: Subtask[];
  repeat?: Repeat; // needs a dueDate to take effect
}

export interface List {
  id: string;
  name: string;
  color: string;
}
