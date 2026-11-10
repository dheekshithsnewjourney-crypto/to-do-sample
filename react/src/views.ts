import type { Task, View } from './types';

// Which tasks a sidebar view shows. Dates are YYYY-MM-DD strings, so plain string comparison is correct.
export function inView(t: Task, view: View, today: string): boolean {
  if (view === 'all') return true;
  if (view === 'today') return !!t.dueDate && (t.dueDate === today || (!t.done && t.dueDate < today));
  if (view === 'upcoming') return !!t.dueDate && t.dueDate > today;
  if (view === 'overdue') return !t.done && !!t.dueDate && t.dueDate < today;
  return t.listId === view.slice(5);
}

// A one or two letter marker for a list: "Work" -> "WO", "Side projects" -> "SP".
// Lists are told apart by this monogram instead of by extra colours.
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).map((w) => Array.from(w));
  const letters = words.length > 1 ? [words[0][0], words[1][0]] : (words[0] ?? []).slice(0, 2);
  return letters.join('').toUpperCase();
}

// A task added while looking at Today is due today, so it appears where it was added.
export function dueForNewTask(view: View, today: string, explicit?: string): string | undefined {
  return explicit ?? (view === 'today' ? today : undefined);
}
