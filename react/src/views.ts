import { nextDue, parseISO } from './dates';
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

// "1 task", "2 tasks": Intl.PluralRules picks the form, so counts never read "1 tasks".
const plurals = new Intl.PluralRules('en');
export function count(n: number, noun: string): string {
  return `${n} ${plurals.select(n) === 'one' ? noun : `${noun}s`}`;
}

// A task added while looking at Today is due today, so it appears where it was added.
export function dueForNewTask(view: View, today: string, explicit?: string): string | undefined {
  return explicit ?? (view === 'today' ? today : undefined);
}

const WHEN = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); // reused, see dates.ts

const MONTH = new Intl.DateTimeFormat(undefined, { month: 'long' });
const MONTH_YEAR = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const DAY_MS = 86400000;
const utcDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

// The "when" rail of the sheet: the group a task belongs to, read left of the row.
export function whenLabel(t: Task, today: string): string {
  if (t.done) return 'Done';
  if (!t.dueDate) return 'No date';
  if (t.dueDate < today) return 'Overdue';
  if (t.dueDate === today) return 'Today';
  if (t.dueDate === nextDue(today, 'daily')) return 'Tomorrow';
  const d = parseISO(t.dueDate);
  const now = parseISO(today);
  if (!d || !now) return 'No date';
  // The next 7 days are listed one by one; later dates group under their month.
  if ((utcDay(d) - utcDay(now)) / DAY_MS <= 7) return WHEN.format(d);
  return d.getFullYear() === now.getFullYear() ? MONTH.format(d) : MONTH_YEAR.format(d);
}
