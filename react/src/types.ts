export type Priority = 'low' | 'med' | 'high';
export type Filter = 'all' | 'active' | 'done';
export type Sort = 'newest' | 'due' | 'priority';

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
  dueDate?: string; // YYYY-MM-DD, optional so older saved tasks still load
}
