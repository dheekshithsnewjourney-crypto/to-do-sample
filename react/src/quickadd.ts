import { todayISO } from './dates';
import type { Priority } from './types';

export interface Parsed {
  text: string;
  priority?: Priority;
  dueDate?: string;
}

// Tokens only count as whole, whitespace-separated words, so "tomorrow's" or "wow!high" stay text.
const PRIORITY = /(^|\s)!(high|medium|med|low)(?=\s|$)/gi;
const DATE_WORD = /(^|\s)(today|tomorrow)(?=\s|$)/gi;
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();

// "Pay rent tomorrow !high" -> text "Pay rent", due tomorrow, high priority
export function parseQuickAdd(input: string, now = new Date()): Parsed {
  let text = input;
  let priority: Priority | undefined;
  let dueDate: string | undefined;

  // Every priority token is removed; if several were typed, the last one wins.
  text = text.replace(PRIORITY, (_match, lead: string, word: string) => {
    const level = word.toLowerCase();
    priority = level === 'medium' ? 'med' : (level as Priority);
    return lead;
  });

  // The last standalone date word is the due date. Earlier ones are part of the title.
  const last = [...text.matchAll(DATE_WORD)].pop();
  if (last) {
    const rest = tidy(text.slice(0, last.index) + ' ' + text.slice(last.index + last[0].length));
    if (rest) { // a task that is only the word "today" keeps it as its title
      const offset = last[2].toLowerCase() === 'today' ? 0 : 1;
      dueDate = todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
      text = rest;
    }
  }
  return { text: tidy(text), priority, dueDate };
}
