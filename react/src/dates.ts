import type { Repeat } from './types';

// All dates are local calendar days stored as YYYY-MM-DD strings, which also sort correctly as text.
// Nothing here goes through UTC timestamps, so a due date never shifts with the user's timezone.

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

// Local midnight for a year/month/day. setFullYear avoids `new Date(y, …)` mapping years 0-99 to 19xx.
function localDate(y: number, monthIndex: number, d: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(y, monthIndex, d);
  return date;
}

const daysInMonth = (y: number, monthIndex: number) => localDate(y, monthIndex + 1, 0).getDate();

// Strict parser: only real calendar dates in YYYY-MM-DD form.
export function parseISO(iso: unknown): Date | null {
  if (typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo - 1)) return null;
  return localDate(y, mo - 1, d);
}

export const isISODate = (value: unknown): value is string => parseISO(value) !== null;

export function todayISO(d = new Date()): string {
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Whole calendar days from a to b. Counting in UTC keeps daylight-saving days (23h or 25h long) exact.
function dayDiff(a: Date, b: Date): number {
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / 86400000);
}

export type DueTone = 'overdue' | 'today' | 'later';

export function dueInfo(iso: string, done: boolean, now = new Date()): { label: string; tone: DueTone } {
  const due = parseISO(iso);
  if (!due) return { label: 'No date', tone: 'later' };
  const diff = dayDiff(now, due);
  const short = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (diff === 0) return { label: 'Today', tone: done ? 'later' : 'today' };
  if (diff === 1) return { label: 'Tomorrow', tone: 'later' };
  if (diff > 1 || done) return { label: short, tone: 'later' }; // a finished task is never "overdue"
  return { label: diff === -1 ? 'Due yesterday' : `${-diff} days overdue`, tone: 'overdue' };
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// The occurrence after `iso`. For monthly repeats, `anchorDay` is the day of the month the series
// started on, so Jan 31 -> Feb 28 -> Mar 31 instead of sticking to the 28th for good.
export function nextDue(iso: string, repeat: Repeat, anchorDay?: number): string {
  const from = parseISO(iso);
  if (!from) return iso;
  const [y, m, d] = [from.getFullYear(), from.getMonth(), from.getDate()];
  if (repeat === 'daily') return todayISO(localDate(y, m, d + 1));
  if (repeat === 'weekly') return todayISO(localDate(y, m, d + 7));
  const first = localDate(y, m + 1, 1);
  const day = Math.min(anchorDay ?? d, daysInMonth(first.getFullYear(), first.getMonth()));
  return todayISO(localDate(first.getFullYear(), first.getMonth(), day));
}

// The next occurrence that is not already in the past: finishing a daily task five days late
// should not leave four more overdue copies to click through.
export function nextDueFrom(iso: string, repeat: Repeat, today?: string, anchorDay?: number): string {
  const anchor = anchorDay ?? parseISO(iso)?.getDate(); // keep the series' own day across short months
  let next = nextDue(iso, repeat, anchor);
  if (!today || !isISODate(today) || !isISODate(iso)) return next;
  while (next < today) next = nextDue(next, repeat, anchor);
  return next;
}
