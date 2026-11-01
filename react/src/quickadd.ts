import { todayISO } from './dates';
import type { Priority } from './types';

export interface Parsed {
  text: string;
  priority?: Priority;
  dueDate?: string;
}

// "Pay rent tomorrow !high" -> text "Pay rent", due tomorrow, high priority
export function parseQuickAdd(input: string, now = new Date()): Parsed {
  let text = input;
  let priority: Priority | undefined;
  let dueDate: string | undefined;

  const p = text.match(/(^|\s)!(high|med|low)\b/i);
  if (p) {
    priority = p[2].toLowerCase() as Priority;
    text = text.replace(p[0], ' ');
  }

  const d = text.match(/\b(today|tomorrow)\b/i);
  if (d) {
    const rest = text.replace(d[0], ' ').replace(/\s+/g, ' ').trim();
    if (rest) { // a task that is only the word "today" keeps it as its title
      const offset = d[1].toLowerCase() === 'today' ? 0 : 1;
      dueDate = todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
      text = rest;
    }
  }
  return { text: text.replace(/\s+/g, ' ').trim(), priority, dueDate };
}
